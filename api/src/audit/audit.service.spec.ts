import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
      auditLog: { create: jest.fn(), findMany: jest.fn() },
      auditChainHead: { update: jest.fn() },
    };
    prisma.$transaction = jest.fn((cb: any) => cb(prisma));

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  it('chaîne la nouvelle écriture à la tête existante et met à jour la tête', async () => {
    prisma.$queryRaw.mockResolvedValue([{ derniere_empreinte: 'hash-precedent' }]);

    await service.record({ action: 'remise', entite: 'ticket', entiteId: 't1' });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ empreintePrecedente: 'hash-precedent' }) }),
    );
    const empreinte = prisma.auditLog.create.mock.calls[0][0].data.empreinte;
    expect(typeof empreinte).toBe('string');
    expect(empreinte.length).toBeGreaterThan(0);
    expect(prisma.auditChainHead.update).toHaveBeenCalledWith({
      where: { id: 'default' },
      data: { derniereEmpreinte: empreinte },
    });
  });

  it('démarre la chaîne avec empreintePrecedente=null quand aucune tête n\'existe encore', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await service.record({ action: 'remise', entite: 'ticket' });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ empreintePrecedente: null }) }),
    );
  });

  it('produit des empreintes différentes pour un contenu différent (détection d\'altération)', async () => {
    prisma.$queryRaw.mockResolvedValue([{ derniere_empreinte: 'hash-precedent' }]);

    await service.record({ action: 'remise', entite: 'ticket', apres: { montant: 1000 } });
    const empreinte1 = prisma.auditLog.create.mock.calls[0][0].data.empreinte;

    prisma.auditLog.create.mockClear();
    await service.record({ action: 'remise', entite: 'ticket', apres: { montant: 2000 } });
    const empreinte2 = prisma.auditLog.create.mock.calls[0][0].data.empreinte;

    expect(empreinte1).not.toBe(empreinte2);
  });

  it('ne laisse jamais une écriture de journal en échec remonter à l\'appelant', async () => {
    prisma.$transaction.mockRejectedValue(new Error('Connexion base perdue'));

    await expect(
      service.record({ action: 'remise', entite: 'ticket' }),
    ).resolves.toBeUndefined();
  });
});
