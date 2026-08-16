import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

// Commission calculée sur le CA encaissé net de remise, jamais le CA facturé
// (CDC §4.6) — un ticket annulé ou non payé ne compte pas. Verrouillée dès
// que marquée « versée ».
@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private periodRange(periode: string): { start: Date; end: Date } {
    const [y, m] = periode.split('-').map(Number);
    return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
  }

  async preview(userId: string, periode: string) {
    const { start, end } = this.periodRange(periode);
    const [profile, agg, stored] = await Promise.all([
      this.prisma.staffProfile.findUnique({ where: { userId } }),
      this.prisma.ticket.aggregate({
        where: { coiffeurId: userId, statut: 'paye', payeLe: { gte: start, lt: end } },
        _sum: { total: true },
      }),
      this.prisma.commission.findUnique({ where: { userId_periode: { userId, periode } } }),
    ]);

    const taux = profile?.tauxCommission ?? 15;
    const baseCa = agg._sum.total ?? 0;
    const montant = Math.round((baseCa * taux) / 100);

    return {
      id: stored?.id ?? null,
      userId,
      periode,
      baseCa,
      taux,
      montant,
      statut: stored?.statut ?? 'due',
      verseLe: stored?.verseLe ?? null,
      genere: !!stored,
    };
  }

  // Requêtes groupées (3 au total, jamais 3×N) — un previewAll() qui
  // délèguerait à preview() par coiffeur épuise vite le pool de connexions
  // Prisma dès que l'équipe grandit (même incident que le décompte de stock).
  async previewAll(salonId: string, periode: string) {
    const { start, end } = this.periodRange(periode);
    const coiffeurs = await this.prisma.user.findMany({
      where: { salonId, role: 'coiffeur', actif: true },
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
    const coiffeurIds = coiffeurs.map((c) => c.id);
    if (!coiffeurIds.length) return [];

    const [profiles, sommes, stored] = await Promise.all([
      this.prisma.staffProfile.findMany({ where: { userId: { in: coiffeurIds } } }),
      this.prisma.ticket.groupBy({
        by: ['coiffeurId'],
        where: { coiffeurId: { in: coiffeurIds }, statut: 'paye', payeLe: { gte: start, lt: end } },
        _sum: { total: true },
      }),
      this.prisma.commission.findMany({
        where: { userId: { in: coiffeurIds }, periode },
      }),
    ]);

    const tauxByUser = new Map(profiles.map((p) => [p.userId, p.tauxCommission]));
    const caByUser = new Map(sommes.map((s) => [s.coiffeurId, s._sum.total ?? 0]));
    const storedByUser = new Map(stored.map((s) => [s.userId, s]));

    return coiffeurs.map((c) => {
      const taux = tauxByUser.get(c.id) ?? 15;
      const baseCa = caByUser.get(c.id) ?? 0;
      const montant = Math.round((baseCa * taux) / 100);
      const row = storedByUser.get(c.id);
      return {
        id: row?.id ?? null,
        userId: c.id,
        nom: c.nom,
        periode,
        baseCa,
        taux,
        montant,
        statut: row?.statut ?? 'due',
        verseLe: row?.verseLe ?? null,
        genere: !!row,
      };
    });
  }

  async generate(userId: string, periode: string, actorId: string) {
    const existing = await this.prisma.commission.findUnique({
      where: { userId_periode: { userId, periode } },
    });
    if (existing?.statut === 'versee') {
      throw new ConflictException('Cette commission est déjà versée et verrouillée');
    }

    const { baseCa, taux, montant } = await this.preview(userId, periode);

    const commission = await this.prisma.commission.upsert({
      where: { userId_periode: { userId, periode } },
      create: { userId, periode, baseCa, taux, montant, statut: 'due' },
      update: { baseCa, taux, montant },
    });

    await this.audit.record({
      auteurId: actorId,
      action: 'commission_generee',
      entite: 'commission',
      entiteId: commission.id,
      apres: { userId, periode, baseCa, taux, montant },
    });

    return commission;
  }

  async generateBatch(salonId: string, periode: string, actorId: string, userId?: string) {
    if (userId) {
      return [await this.generate(userId, periode, actorId)];
    }
    const coiffeurs = await this.prisma.user.findMany({
      where: { salonId, role: 'coiffeur', actif: true },
      select: { id: true },
    });
    const results = [];
    for (const c of coiffeurs) {
      results.push(await this.generate(c.id, periode, actorId));
    }
    return results;
  }

  async markPaid(id: string, actorId: string) {
    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException('Commission introuvable');
    if (commission.statut === 'versee') {
      throw new ConflictException('Déjà marquée versée');
    }

    const updated = await this.prisma.commission.update({
      where: { id },
      data: { statut: 'versee', verseLe: new Date() },
    });

    await this.audit.record({
      auteurId: actorId,
      action: 'commission_versee',
      entite: 'commission',
      entiteId: id,
      avant: { statut: commission.statut },
      apres: { statut: 'versee', montant: commission.montant },
    });

    return updated;
  }
}
