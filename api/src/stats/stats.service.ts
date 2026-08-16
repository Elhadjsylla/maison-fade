import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { StockService } from '../stock/stock.service';
import { AttendanceService } from '../staff/attendance.service';

const REMISE_ANORMALE_SEUIL = 20; // % — au-delà, signalé en supervision 360°

// Toute l'agrégation se fait en mémoire à partir d'une seule lecture des
// tickets de la période (avec items/paiements inclus) plutôt qu'un groupBy
// par axe — évite de multiplier les requêtes (cf. l'incident de pool de
// connexions sur le récap commissions) pour un volume de données qui reste
// petit (un salon, quelques centaines de tickets/mois).
@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly stock: StockService,
    private readonly attendance: AttendanceService,
  ) {}

  async overview(salonId: string, from: string, to: string, coiffeurId?: string) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000);
    const rangeMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - rangeMs);

    const baseWhere = {
      statut: 'paye' as const,
      coiffeur: { salonId },
      ...(coiffeurId ? { coiffeurId } : {}),
    };

    const [tickets, prevAgg] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { ...baseWhere, payeLe: { gte: start, lt: end } },
        include: {
          items: { include: { service: { include: { categorie: true } } } },
          payments: { where: { statut: 'succeeded' } },
          coiffeur: { select: { id: true, nom: true } },
          client: { select: { id: true, nom: true } },
        },
      }),
      this.prisma.ticket.aggregate({
        where: { ...baseWhere, payeLe: { gte: prevStart, lt: start } },
        _sum: { total: true },
      }),
    ]);

    const ca = tickets.reduce((s, t) => s + t.total, 0);
    const caPrecedent = prevAgg._sum.total ?? 0;
    const variationPct = caPrecedent > 0 ? Math.round(((ca - caPrecedent) / caPrecedent) * 1000) / 10 : null;
    const panierMoyen = tickets.length ? Math.round(ca / tickets.length) : 0;

    const parMoyen = new Map<string, number>();
    const parCoiffeur = new Map<string, { nom: string; ca: number; tickets: number; remise: number }>();
    const parCategorie = new Map<string, number>();
    const parPrestation = new Map<string, { nom: string; qte: number; ca: number }>();
    const parHeure = new Array(24).fill(0);
    const parClient = new Map<string, { nom: string; visites: number; total: number }>();

    for (const t of tickets) {
      for (const p of t.payments) {
        parMoyen.set(p.methode, (parMoyen.get(p.methode) ?? 0) + p.montant);
      }

      const coif = parCoiffeur.get(t.coiffeurId) ?? { nom: t.coiffeur.nom, ca: 0, tickets: 0, remise: 0 };
      coif.ca += t.total;
      coif.tickets += 1;
      coif.remise += t.remiseMontant;
      parCoiffeur.set(t.coiffeurId, coif);

      for (const it of t.items) {
        if (!it.service) continue;
        const catNom = it.service.categorie?.nom ?? 'Autre';
        parCategorie.set(catNom, (parCategorie.get(catNom) ?? 0) + it.total);

        const pr = parPrestation.get(it.service.id) ?? { nom: it.service.nom, qte: 0, ca: 0 };
        pr.qte += it.quantite;
        pr.ca += it.total;
        parPrestation.set(it.service.id, pr);
      }

      if (t.payeLe) parHeure[new Date(t.payeLe).getUTCHours()] += t.total;

      if (t.clientId && t.client) {
        const c = parClient.get(t.clientId) ?? { nom: t.client.nom, visites: 0, total: 0 };
        c.visites += 1;
        c.total += t.total;
        parClient.set(t.clientId, c);
      }
    }

    const clientsUniques = parClient.size;
    const clientsFideles = [...parClient.values()].filter((c) => c.visites > 1).length;
    const tauxRetourClient = clientsUniques ? Math.round((clientsFideles / clientsUniques) * 1000) / 10 : 0;

    return {
      from,
      to,
      ca,
      caPrecedent,
      variationPct,
      tickets: tickets.length,
      panierMoyen,
      tauxRetourClient,
      clientsUniques,
      clientsFideles,
      parMoyen: Object.fromEntries(parMoyen),
      parCoiffeur: [...parCoiffeur.entries()].map(([coiffeurId, v]) => ({ coiffeurId, ...v })),
      parCategorie: Object.fromEntries(parCategorie),
      parHeure,
      topPrestations: [...parPrestation.values()].sort((a, b) => b.ca - a.ca).slice(0, 5),
      topClients: [...parClient.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    };
  }

  // Série jour par jour (graphique hebdomadaire du tableau de bord) — une
  // seule lecture des tickets de la fenêtre, regroupés en mémoire par date
  // locale du salon (Africa/Dakar = UTC, pas de décalage à gérer).
  async dailySeries(salonId: string, days: number, coiffeurId?: string) {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(end.getTime() - days * 86_400_000);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        statut: 'paye',
        payeLe: { gte: start, lt: end },
        coiffeur: { salonId },
        ...(coiffeurId ? { coiffeurId } : {}),
      },
      select: { total: true, payeLe: true, clientId: true },
    });

    const parJour = new Map<string, { ca: number; tickets: number; clients: Set<string> }>();
    for (const t of tickets) {
      const jour = t.payeLe!.toISOString().slice(0, 10);
      const acc = parJour.get(jour) ?? { ca: 0, tickets: 0, clients: new Set<string>() };
      acc.ca += t.total;
      acc.tickets += 1;
      if (t.clientId) acc.clients.add(t.clientId);
      parJour.set(jour, acc);
    }

    const serie: { date: string; ca: number; tickets: number; clients: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - (i + 1) * 86_400_000);
      const date = d.toISOString().slice(0, 10);
      const acc = parJour.get(date);
      serie.push({ date, ca: acc?.ca ?? 0, tickets: acc?.tickets ?? 0, clients: acc?.clients.size ?? 0 });
    }
    return serie;
  }

  // Supervision 360° (CDC §3.1) — vue temps réel + alertes, réservée à l'admin.
  async supervision360(salonId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);

    const [salon, caAujourdhui, ticketsOuverts, equipe, derniereSessionFermee, pendants, produits, connexionsEchouees, remisesDuJour] =
      await Promise.all([
        this.prisma.salon.findUnique({ where: { id: salonId } }),
        this.prisma.ticket.aggregate({
          where: { statut: 'paye', payeLe: { gte: todayStart, lt: todayEnd }, coiffeur: { salonId } },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.ticket.count({ where: { statut: 'ouvert', coiffeur: { salonId } } }),
        this.attendance.teamToday(salonId),
        this.prisma.cashSession.findFirst({
          where: { salonId, fermeLe: { not: null } },
          orderBy: { fermeLe: 'desc' },
        }),
        this.payments.listPending(),
        this.stock.findAllProducts(),
        this.prisma.auditLog.findMany({
          where: { action: 'connexion_echouee', horodatage: { gte: todayStart } },
          orderBy: { horodatage: 'desc' },
          take: 10,
        }),
        this.prisma.ticket.findMany({
          where: {
            statut: 'paye',
            payeLe: { gte: todayStart, lt: todayEnd },
            remiseMontant: { gt: 0 },
            coiffeur: { salonId },
          },
          include: { coiffeur: { select: { nom: true } } },
        }),
      ]);

    const alertes: { type: string; severite: 'info' | 'warn' | 'crit'; message: string }[] = [];

    if (derniereSessionFermee?.ecart != null && derniereSessionFermee.ecart !== 0) {
      alertes.push({
        type: 'ecart_cloture',
        severite: Math.abs(derniereSessionFermee.ecart) > 5000 ? 'crit' : 'warn',
        message: `Écart de clôture de ${derniereSessionFermee.ecart} F le ${derniereSessionFermee.fermeLe?.toISOString().slice(0, 10)}`,
      });
    }

    for (const t of remisesDuJour) {
      const pourcent = t.sousTotal > 0 ? (t.remiseMontant / t.sousTotal) * 100 : 0;
      if (pourcent > REMISE_ANORMALE_SEUIL) {
        alertes.push({
          type: 'remise_anormale',
          severite: 'warn',
          message: `Remise de ${Math.round(pourcent)}% par ${t.coiffeur.nom} sur le ticket #${t.numero}`,
        });
      }
    }

    for (const p of produits) {
      if (p.quantite <= p.seuilCritique) {
        alertes.push({
          type: 'stock_critique',
          severite: 'crit',
          message: `${p.nom} : ${p.quantite} restant(s) (seuil critique ${p.seuilCritique})`,
        });
      }
    }

    for (const { user, attendance: a } of equipe) {
      if (a?.retardMin) {
        alertes.push({
          type: 'retard_pointage',
          severite: 'warn',
          message: `${user.nom} a pointé avec ${a.retardMin} min de retard`,
        });
      }
    }

    for (const p of pendants) {
      alertes.push({
        type: 'paiement_non_confirme',
        severite: 'warn',
        message: `Paiement ${p.methode} en attente depuis le ${p.initieLe.toISOString().slice(11, 16)} (ticket ${p.ticketId})`,
      });
    }

    for (const log of connexionsEchouees) {
      const ap = log.apres as { login?: string; raison?: string } | null;
      alertes.push({
        type: 'connexion_echouee',
        severite: 'info',
        message: `Tentative de connexion refusée pour « ${ap?.login ?? '?'} » (${ap?.raison ?? 'raison inconnue'})`,
      });
    }

    return {
      caAujourdhui: caAujourdhui._sum.total ?? 0,
      ticketsAujourdhui: caAujourdhui._count,
      ticketsOuverts,
      fauteuils: salon?.fauteuils ?? 1,
      occupationApprox: salon?.fauteuils
        ? Math.min(100, Math.round((ticketsOuverts / salon.fauteuils) * 100))
        : 0,
      equipe: equipe.map(({ user, attendance: a }) => ({
        userId: user.id,
        nom: user.nom,
        role: user.role,
        present: !!a?.heureArrivee && !a?.heureDepart,
        heureArrivee: a?.heureArrivee ?? null,
        retardMin: a?.retardMin ?? 0,
      })),
      alertes,
    };
  }
}
