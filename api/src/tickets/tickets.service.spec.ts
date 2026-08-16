import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';

jest.mock('argon2');

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: any;
  let paymentsService: { createIntent: jest.Mock; confirmTicketPayment: jest.Mock };

  const coiffeur: AuthenticatedUser = {
    id: 'coiffeur-1',
    login: 'palaye',
    nom: 'Pa Laye',
    role: 'coiffeur',
    salonId: 'salon-1',
    deviceId: 'device-1',
  };

  const ticketOuvert = {
    id: 'ticket-1',
    statut: 'ouvert',
    sousTotal: 10000,
    remiseMontant: 0,
    remiseMotif: null,
    total: 10000,
  };

  beforeEach(async () => {
    prisma = {
      cashSession: { findFirst: jest.fn() },
      user: { findFirst: jest.fn(), findUnique: jest.fn() },
      $queryRaw: jest.fn(),
      ticket: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      ticketItem: {
        createMany: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      service: { findFirst: jest.fn() },
      product: { findFirst: jest.fn() },
      rolePermission: { findUnique: jest.fn() },
      payment: { create: jest.fn() },
    };

    paymentsService = {
      createIntent: jest.fn(),
      confirmTicketPayment: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: AuditService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = moduleRef.get(TicketsService);

    // findOne() est appelé en fin de la plupart des méthodes publiques — on
    // le fait pointer vers un ticket ouvert par défaut, personnalisable par test.
    prisma.ticket.findUnique.mockResolvedValue(ticketOuvert);
  });

  describe('create', () => {
    it('refuse si aucune session de caisse n\'est ouverte', async () => {
      prisma.cashSession.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue({ id: 'coiffeur-1' });

      await expect(
        service.create('salon-1', 'user-1', { coiffeurId: 'coiffeur-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuse un coiffeur inactif ou inexistant', async () => {
      prisma.cashSession.findFirst.mockResolvedValue({ id: 'session-1' });
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create('salon-1', 'user-1', { coiffeurId: 'coiffeur-x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('numérote le ticket atomiquement et insère les articles en une seule fois', async () => {
      prisma.cashSession.findFirst.mockResolvedValue({ id: 'session-1' });
      prisma.user.findFirst.mockResolvedValue({ id: 'coiffeur-1' });
      prisma.$queryRaw.mockResolvedValue([{ dernier: 248 }]);
      prisma.ticket.create.mockResolvedValue({ id: 'ticket-1', numero: 248 });
      prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', nom: 'Dégradé', prix: 4000 });
      prisma.ticketItem.findMany.mockResolvedValue([{ total: 4000 }]);
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({ ...ticketOuvert, remiseMontant: 0 });

      await service.create('salon-1', 'user-1', {
        coiffeurId: 'coiffeur-1',
        items: [{ serviceId: 'svc-1', quantite: 1 }],
      });

      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ numero: 248 }) }),
      );
      expect(prisma.ticketItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ ticketId: 'ticket-1', serviceId: 'svc-1', prixUnitaire: 4000, total: 4000 })],
      });
    });
  });

  describe('addItem / removeItem — recalcul des totaux', () => {
    it('recalcule sous-total et total après ajout d\'un article', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', nom: 'Coupe', prix: 3000 });
      prisma.ticketItem.findMany.mockResolvedValue([{ total: 3000 }]);
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({ ...ticketOuvert, remiseMontant: 500 });

      await service.addItem('ticket-1', { serviceId: 'svc-1' });

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { sousTotal: 3000, total: 2500 } }),
      );
    });

    it('refuse d\'ajouter un article à un ticket qui n\'est plus ouvert', async () => {
      prisma.ticket.findUnique.mockResolvedValue({ ...ticketOuvert, statut: 'paye' });
      await expect(service.addItem('ticket-1', { serviceId: 'svc-1' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejette une ligne sans serviceId ni productId', async () => {
      await expect(service.addItem('ticket-1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recalcule après suppression d\'un article', async () => {
      prisma.ticketItem.findFirst.mockResolvedValue({ id: 'item-1', ticketId: 'ticket-1' });
      prisma.ticketItem.findMany.mockResolvedValue([]);
      prisma.ticket.findUniqueOrThrow.mockResolvedValue({ ...ticketOuvert, remiseMontant: 0 });

      await service.removeItem('ticket-1', 'item-1');

      expect(prisma.ticketItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { sousTotal: 0, total: 0 } }),
      );
    });
  });

  describe('applyDiscount', () => {
    it('exige un motif au-delà de 10 %, quel que soit le rôle', async () => {
      await expect(
        service.applyDiscount('ticket-1', { pourcent: 25 }, coiffeur),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('applique directement une remise dans la limite du plafond du rôle', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({ plafond: 10 });

      await service.applyDiscount('ticket-1', { pourcent: 10 }, coiffeur);

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ remiseMontant: 1000 }) }),
      );
    });

    it('exige une autorisation au-delà du plafond du rôle', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({ plafond: 10 });

      await expect(
        service.applyDiscount('ticket-1', { pourcent: 25, motif: 'Client fidèle' }, coiffeur),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuse une autorisation avec un PIN invalide', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({ plafond: 10 });
      prisma.user.findUnique.mockResolvedValue({
        id: 'gerant-1', nom: 'Fallou', role: 'gerant', actif: true, pinHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.applyDiscount(
          'ticket-1',
          { pourcent: 25, motif: 'Client fidèle', authorization: { login: 'fallou', pin: '0000' } },
          coiffeur,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('accepte l\'escalade avec un PIN gérant valide et conserve son identité dans le journal', async () => {
      prisma.rolePermission.findUnique
        .mockResolvedValueOnce({ plafond: 10 }) // plafond du coiffeur (acteur)
        .mockResolvedValueOnce({ plafond: 30 }); // plafond du gérant (approbateur)
      prisma.user.findUnique.mockResolvedValue({
        id: 'gerant-1', nom: 'Fallou', role: 'gerant', actif: true, pinHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const auditService = (service as any).audit;

      await service.applyDiscount(
        'ticket-1',
        { pourcent: 25, motif: 'Client fidèle', authorization: { login: 'fallou', pin: '2345' } },
        coiffeur,
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          apres: expect.objectContaining({
            autorisePar: { id: 'gerant-1', nom: 'Fallou', role: 'gerant' },
          }),
        }),
      );
    });

    it('refuse l\'escalade si le plafond de l\'approbateur est lui aussi dépassé', async () => {
      prisma.rolePermission.findUnique
        .mockResolvedValueOnce({ plafond: 10 })
        .mockResolvedValueOnce({ plafond: 20 });
      prisma.user.findUnique.mockResolvedValue({
        id: 'gerant-1', nom: 'Fallou', role: 'gerant', actif: true, pinHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(
        service.applyDiscount(
          'ticket-1',
          { pourcent: 50, motif: 'Geste commercial', authorization: { login: 'fallou', pin: '2345' } },
          coiffeur,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('pay', () => {
    it('refuse un montant qui ne correspond pas au total du ticket', async () => {
      await expect(
        service.pay('ticket-1', { methode: 'especes', montant: 5000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuse explicitement carte et free_money', async () => {
      await expect(
        service.pay('ticket-1', { methode: 'carte', montant: 10000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.pay('ticket-1', { methode: 'free_money', montant: 10000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('encaisse immédiatement en espèces et calcule le rendu', async () => {
      prisma.payment.create.mockResolvedValue({ id: 'payment-1', statut: 'succeeded' });

      const result = await service.pay('ticket-1', { methode: 'especes', montant: 10000, recu: 10500 });

      expect(paymentsService.confirmTicketPayment).toHaveBeenCalledWith('ticket-1');
      expect(result.rendu).toBe(500);
    });

    it('crée une intention de paiement pour wave sans confirmer le ticket', async () => {
      paymentsService.createIntent.mockResolvedValue({
        payment: { id: 'payment-1' }, launchUrl: 'https://pay.wave.com/x', qr: undefined,
      });

      const result = await service.pay('ticket-1', { methode: 'wave', montant: 10000 });

      expect(paymentsService.createIntent).toHaveBeenCalledWith('ticket-1', 'wave', undefined);
      expect(paymentsService.confirmTicketPayment).not.toHaveBeenCalled();
      expect(result.launchUrl).toBe('https://pay.wave.com/x');
    });
  });

  describe('cancel', () => {
    it('refuse d\'annuler un ticket déjà payé', async () => {
      prisma.ticket.findUnique.mockResolvedValue({ ...ticketOuvert, statut: 'paye' });
      await expect(
        service.cancel('ticket-1', coiffeur, { motif: 'Test' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('annule et journalise avec le motif', async () => {
      await service.cancel('ticket-1', coiffeur, { motif: 'Erreur de saisie' });

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { statut: 'annule', remiseMotif: 'Erreur de saisie' } }),
      );
    });
  });
});
