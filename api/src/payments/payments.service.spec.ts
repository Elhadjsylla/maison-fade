import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TelegramService } from '../alerts/telegram.service';
import { UnitechPayProvider } from './providers/unitech-pay.provider';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let provider: {
    name: string;
    createIntent: jest.Mock;
    verifyWebhook: jest.Mock;
    getStatus: jest.Mock;
  };

  const ticketOuvert = {
    id: 'ticket-1',
    numero: 42,
    statut: 'ouvert',
    total: 6500,
    clientId: 'client-1',
    client: { telephone: '+221 77 000 00 00' },
    items: [],
  };

  beforeEach(async () => {
    prisma = {
      ticket: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      paymentEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      serviceProduct: { findMany: jest.fn().mockResolvedValue([]) },
      product: { update: jest.fn() },
      stockMovement: { createMany: jest.fn(), create: jest.fn() },
      loyaltyAccount: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      loyaltyTransaction: { create: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    provider = {
      name: 'unitechpay',
      createIntent: jest.fn(),
      verifyWebhook: jest.fn(),
      getStatus: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UnitechPayProvider, useValue: provider },
        { provide: AuditService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
        { provide: TelegramService, useValue: { notify: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  describe('createIntent', () => {
    it('rejette un ticket introuvable', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);
      await expect(service.createIntent('nope', 'wave')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejette un ticket qui n\'est plus ouvert', async () => {
      prisma.ticket.findUnique.mockResolvedValue({ ...ticketOuvert, statut: 'paye' });
      await expect(service.createIntent('ticket-1', 'wave')).rejects.toBeInstanceOf(ConflictException);
    });

    it('crée une intention de paiement pending avec le téléphone du client à défaut de saisie', async () => {
      prisma.ticket.findUnique.mockResolvedValue(ticketOuvert);
      provider.createIntent.mockResolvedValue({
        providerRef: 'ref-abc',
        launchUrl: 'https://pay.wave.com/xyz',
        status: 'pending',
      });
      prisma.payment.create.mockResolvedValue({ id: 'payment-1', statut: 'pending' });

      const result = await service.createIntent('ticket-1', 'wave');

      expect(provider.createIntent).toHaveBeenCalledWith(
        expect.objectContaining({ montant: 6500, customerPhone: '+221 77 000 00 00' }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ticketId: 'ticket-1', providerRef: 'ref-abc', statut: 'pending' }),
        }),
      );
      expect(result.launchUrl).toBe('https://pay.wave.com/xyz');
    });
  });

  describe('handleWebhook — signature', () => {
    it('propage le rejet du provider sur une signature invalide, sans toucher la base', async () => {
      provider.verifyWebhook.mockImplementation(() => {
        throw new BadRequestException('Signature UnitechPay invalide');
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), {}),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.paymentEvent.findUnique).not.toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook — doublon', () => {
    it('ignore un événement déjà traité sans ré-appliquer ses effets', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-1',
        type: 'payment_completed',
        providerRef: 'ref-abc',
        montant: 6500,
        frais: 0,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue({ id: 'existing-event' });

      const result = await service.handleWebhook(Buffer.from('{}'), {});

      expect(result).toEqual({ ignored: true });
      expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook — référence inconnue', () => {
    it('lève une 404 si aucun paiement ne correspond à la référence', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-1',
        type: 'payment_completed',
        providerRef: 'ref-inconnue',
        montant: 6500,
        frais: 0,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.handleWebhook(Buffer.from('{}'), {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('handleWebhook — confirmation nominale', () => {
    it('marque le paiement réussi, crédite la fidélité et décrémente le stock', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-1',
        type: 'payment_completed',
        providerRef: 'ref-abc',
        montant: 6500,
        frais: 100,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1' });
      // Le paiement est encore "pending" au moment où applyOutcome vérifie l'état courant.
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'pending', ticketId: 'ticket-1' });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1', statut: 'succeeded' });
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'ticket-1',
        numero: 42,
        statut: 'ouvert',
        total: 6500,
        clientId: 'client-1',
        items: [],
      });
      prisma.loyaltyAccount.findUnique.mockResolvedValue({
        clientId: 'client-1',
        points: 50,
        totalDepense: 10000,
      });

      const result = await service.handleWebhook(Buffer.from('{}'), {});

      expect(result).toEqual({ ignored: false });
      expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventIdProvider: 'evt-1' }) }),
      );
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ticket-1' }, data: expect.objectContaining({ statut: 'paye' }) }),
      );
      // 6500 F encaissés → 65 points gagnés (1 pt / 100 F), palier toujours bronze (< 200 pts).
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ points: 115, palier: 'bronze' }),
        }),
      );
    });

    it('passe le compte fidélité au palier argent à 200 points', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-2',
        type: 'payment_completed',
        providerRef: 'ref-abc',
        montant: 6500,
        frais: 0,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1' });
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'pending', ticketId: 'ticket-1' });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1', statut: 'succeeded' });
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'ticket-1', numero: 42, statut: 'ouvert', total: 15000, clientId: 'client-1', items: [],
      });
      prisma.loyaltyAccount.findUnique.mockResolvedValue({ clientId: 'client-1', points: 150, totalDepense: 0 });

      await service.handleWebhook(Buffer.from('{}'), {});

      // 150 + floor(15000/100)=150 → 300 points → palier argent (>= 200).
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ points: 300, palier: 'argent' }) }),
      );
    });
  });

  describe('handleWebhook — ordre inversé / retard (CDC §5.5, aucune transition arrière)', () => {
    it('ignore un payment_completed tardif reçu après un payment_failed déjà traité', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-late',
        type: 'payment_completed',
        providerRef: 'ref-abc',
        montant: 6500,
        frais: 0,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1' });
      // Le paiement a déjà été résolu "failed" (webhook précédent ou réconciliation).
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'failed', ticketId: 'ticket-1' });

      const result = await service.handleWebhook(Buffer.from('{}'), {});

      expect(result).toEqual({ ignored: false }); // l'événement est journalisé...
      expect(prisma.payment.update).not.toHaveBeenCalled(); // ...mais son effet est refusé.
      expect(prisma.ticket.update).not.toHaveBeenCalled();
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });

    it('ignore un webhook qui confirme un paiement déjà validé par la réconciliation active', async () => {
      provider.verifyWebhook.mockReturnValue({
        eventIdProvider: 'evt-webhook-en-retard',
        type: 'payment_completed',
        providerRef: 'ref-abc',
        montant: 6500,
        frais: 0,
        raw: {},
      });
      prisma.paymentEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1' });
      // La réconciliation a déjà marqué ce paiement "succeeded" avant l'arrivée du webhook.
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'succeeded', ticketId: 'ticket-1' });

      await service.handleWebhook(Buffer.from('{}'), {});

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });
  });

  describe('reconcilePending', () => {
    it('confirme un paiement pending dont le prestataire indique le succès', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'payment-1', providerRef: 'ref-abc', ticketId: 'ticket-1', statut: 'pending' },
      ]);
      provider.getStatus.mockResolvedValue('succeeded');
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'pending', ticketId: 'ticket-1' });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', ticketId: 'ticket-1', statut: 'succeeded' });
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'ticket-1', numero: 1, statut: 'ouvert', total: 1000, clientId: null, items: [],
      });

      const result = await service.reconcilePending();

      expect(result).toEqual({ checked: 1 });
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ statut: 'paye' }) }),
      );
    });

    it('ne fait pas planter le lot si un prestataire injoignable renvoie une erreur', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'payment-1', providerRef: 'ref-abc', ticketId: 'ticket-1', statut: 'pending' },
      ]);
      provider.getStatus.mockRejectedValue(new Error('fetch failed'));

      const result = await service.reconcilePending();

      expect(result).toEqual({ checked: 1 });
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('ignore les paiements sans référence prestataire', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'payment-1', providerRef: null, ticketId: 'ticket-1', statut: 'pending' },
      ]);

      await service.reconcilePending();

      expect(provider.getStatus).not.toHaveBeenCalled();
    });

    it('marque le paiement échoué si le prestataire indique un échec', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'payment-1', providerRef: 'ref-abc', ticketId: 'ticket-1', statut: 'pending' },
      ]);
      provider.getStatus.mockResolvedValue('failed');
      prisma.payment.findUnique.mockResolvedValue({ id: 'payment-1', statut: 'pending', ticketId: 'ticket-1' });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', statut: 'failed', ticketId: 'ticket-1' });

      await service.reconcilePending();

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ statut: 'failed' }) }),
      );
      expect(prisma.ticket.update).not.toHaveBeenCalled(); // le ticket reste ouvert, pas de fidélité/stock
    });
  });

  describe('confirmTicketPayment — décrément de stock', () => {
    it('décrémente une seule fois un produit consommé par plusieurs articles du ticket', async () => {
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'ticket-1',
        numero: 42,
        statut: 'ouvert',
        total: 8000,
        clientId: null,
        items: [
          { serviceId: 'svc-1', quantite: 1 },
          { serviceId: 'svc-2', quantite: 2 },
        ],
      });
      prisma.serviceProduct.findMany.mockResolvedValue([
        { serviceId: 'svc-1', productId: 'prod-gel', quantiteConsommee: 1, product: { nom: 'Gel coiffant' } },
        { serviceId: 'svc-2', productId: 'prod-gel', quantiteConsommee: 1, product: { nom: 'Gel coiffant' } },
      ]);

      await service.confirmTicketPayment('ticket-1');

      // svc-1 (x1) + svc-2 (x2) consomment chacun 1 unité de gel par prestation
      // → décrément total de 1×1 + 1×2 = 3, en un seul appel, pas deux.
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-gel' },
        data: { quantite: { decrement: 3 } },
      });
      expect(prisma.stockMovement.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ productId: 'prod-gel', quantite: 1 }),
          expect.objectContaining({ productId: 'prod-gel', quantite: 2 }),
        ],
      });
    });
  });

  describe('refund', () => {
    const paymentReussi = {
      id: 'payment-1',
      statut: 'succeeded',
      ticket: {
        id: 'ticket-1',
        numero: 42,
        total: 6500,
        clientId: 'client-1',
        items: [],
      },
    };

    it('lève une 404 si le paiement est introuvable', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.refund('nope', 'Test')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse de rembourser un paiement qui n\'a pas réussi', async () => {
      prisma.payment.findUnique.mockResolvedValue({ ...paymentReussi, statut: 'pending' });
      await expect(service.refund('payment-1', 'Test')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rembourse, repasse le ticket en "rembourse" et annule les points gagnés', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentReussi);
      prisma.loyaltyAccount.findUnique.mockResolvedValue({
        clientId: 'client-1', points: 100, totalDepense: 20000,
      });

      await service.refund('payment-1', 'Client insatisfait');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { statut: 'refunded' } }),
      );
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ statut: 'rembourse' }) }),
      );
      // 6500 F remboursés → 65 points annulés (mêmes règles qu'au gain).
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ points: 35 }) }),
      );
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'annulation', points: -65 }) }),
      );
    });

    it('ne fait jamais descendre les points sous zéro', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentReussi);
      prisma.loyaltyAccount.findUnique.mockResolvedValue({
        clientId: 'client-1', points: 10, totalDepense: 20000,
      });

      await service.refund('payment-1', 'Test');

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ points: 0 }) }),
      );
    });
  });

  describe('confirmTicketPayment — idempotence', () => {
    it('ne refait rien si le ticket est déjà marqué payé', async () => {
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'ticket-1', statut: 'paye', numero: 1, total: 1000, clientId: null, items: [],
      });

      await service.confirmTicketPayment('ticket-1');

      expect(prisma.ticket.update).not.toHaveBeenCalled();
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });
  });
});
