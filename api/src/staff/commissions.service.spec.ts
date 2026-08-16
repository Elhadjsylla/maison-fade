import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prisma: any;
  let audit: { record: jest.Mock };

  beforeEach(async () => {
    prisma = {
      staffProfile: { findUnique: jest.fn(), findMany: jest.fn() },
      ticket: { aggregate: jest.fn(), groupBy: jest.fn() },
      commission: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      user: { findMany: jest.fn() },
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(CommissionsService);
  });

  describe('preview', () => {
    it('utilise le taux par défaut de 15 % en l\'absence de fiche coiffeur', async () => {
      prisma.staffProfile.findUnique.mockResolvedValue(null);
      prisma.ticket.aggregate.mockResolvedValue({ _sum: { total: 10000 } });
      prisma.commission.findUnique.mockResolvedValue(null);

      const result = await service.preview('coiffeur-1', '2026-08');

      expect(result).toMatchObject({ baseCa: 10000, taux: 15, montant: 1500, statut: 'due', genere: false });
    });

    it('utilise le taux différencié défini sur la fiche coiffeur', async () => {
      prisma.staffProfile.findUnique.mockResolvedValue({ tauxCommission: 20 });
      prisma.ticket.aggregate.mockResolvedValue({ _sum: { total: 10000 } });
      prisma.commission.findUnique.mockResolvedValue(null);

      const result = await service.preview('coiffeur-1', '2026-08');

      expect(result.montant).toBe(2000);
    });

    it('ne compte que le CA encaissé (payeLe dans la période) — 0 F si rien de payé', async () => {
      prisma.staffProfile.findUnique.mockResolvedValue(null);
      prisma.ticket.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.commission.findUnique.mockResolvedValue(null);

      const result = await service.preview('coiffeur-1', '2026-08');

      expect(result.baseCa).toBe(0);
      expect(result.montant).toBe(0);
    });
  });

  describe('generate', () => {
    it('refuse de régénérer une commission déjà versée (verrouillage CDC §4.6)', async () => {
      prisma.commission.findUnique.mockResolvedValue({ id: 'c1', statut: 'versee' });

      await expect(service.generate('coiffeur-1', '2026-08', 'admin-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.commission.upsert).not.toHaveBeenCalled();
    });

    it('upsert la commission due et journalise', async () => {
      prisma.commission.findUnique
        .mockResolvedValueOnce(null) // vérification "déjà versée ?"
        .mockResolvedValueOnce(null); // relu dans preview()
      prisma.staffProfile.findUnique.mockResolvedValue({ tauxCommission: 15 });
      prisma.ticket.aggregate.mockResolvedValue({ _sum: { total: 8250 } });
      prisma.commission.upsert.mockResolvedValue({ id: 'c1', statut: 'due', montant: 1238 });

      await service.generate('coiffeur-1', '2026-08', 'admin-1');

      expect(prisma.commission.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_periode: { userId: 'coiffeur-1', periode: '2026-08' } },
          create: expect.objectContaining({ baseCa: 8250, taux: 15, montant: 1238, statut: 'due' }),
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'commission_generee', auteurId: 'admin-1' }),
      );
    });
  });

  describe('markPaid', () => {
    it('lève une 404 si la commission n\'existe pas', async () => {
      prisma.commission.findUnique.mockResolvedValue(null);
      await expect(service.markPaid('c1', 'admin-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuse de marquer deux fois versée la même commission', async () => {
      prisma.commission.findUnique.mockResolvedValue({ id: 'c1', statut: 'versee' });
      await expect(service.markPaid('c1', 'admin-1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.commission.update).not.toHaveBeenCalled();
    });

    it('verrouille la commission et journalise le versement', async () => {
      prisma.commission.findUnique.mockResolvedValue({ id: 'c1', statut: 'due', montant: 1238 });
      prisma.commission.update.mockResolvedValue({ id: 'c1', statut: 'versee', montant: 1238 });

      await service.markPaid('c1', 'admin-1');

      expect(prisma.commission.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c1' }, data: expect.objectContaining({ statut: 'versee' }) }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'commission_versee', avant: { statut: 'due' } }),
      );
    });
  });

  describe('previewAll', () => {
    it('renvoie 0 F et le taux par défaut pour un coiffeur sans CA ni fiche', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'coiffeur-1', nom: 'Pa Laye' },
        { id: 'coiffeur-2', nom: 'Jaz' },
      ]);
      prisma.staffProfile.findMany.mockResolvedValue([{ userId: 'coiffeur-1', tauxCommission: 15 }]);
      prisma.ticket.groupBy.mockResolvedValue([{ coiffeurId: 'coiffeur-1', _sum: { total: 8250 } }]);
      prisma.commission.findMany.mockResolvedValue([]);

      const result = await service.previewAll('salon-1', '2026-08');

      expect(result).toEqual([
        expect.objectContaining({ userId: 'coiffeur-1', nom: 'Pa Laye', baseCa: 8250, taux: 15, montant: 1238 }),
        expect.objectContaining({ userId: 'coiffeur-2', nom: 'Jaz', baseCa: 0, taux: 15, montant: 0 }),
      ]);
    });

    it('renvoie un tableau vide plutôt que d\'interroger la base si le salon n\'a aucun coiffeur', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.previewAll('salon-1', '2026-08');

      expect(result).toEqual([]);
      expect(prisma.ticket.groupBy).not.toHaveBeenCalled();
    });
  });
});
