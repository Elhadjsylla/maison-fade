import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TelegramService } from '../alerts/telegram.service';
import { UnitechPayProvider } from './providers/unitech-pay.provider';
import type { MethodePaiementExterne } from './providers/payment-provider.interface';

const RECONCILE_AFTER_MS = 2 * 60 * 1000; // CDC §5.4 — intentions en attente depuis plus de 2 min

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: UnitechPayProvider,
    private readonly audit: AuditService,
    private readonly telegram: TelegramService,
  ) {}

  async createIntent(
    ticketId: string,
    methode: MethodePaiementExterne,
    customerPhone?: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { client: true },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    if (ticket.statut !== 'ouvert') {
      throw new ConflictException('Ce ticket n\'est plus ouvert');
    }

    const intent = await this.provider.createIntent({
      montant: ticket.total,
      ticketRef: String(ticket.numero),
      methode,
      // Client de passage : le téléphone saisi au paiement prime sur celui
      // de la fiche client attachée, s'il est fourni (CDC §5.3).
      customerPhone: customerPhone || ticket.client?.telephone,
    });

    const payment = await this.prisma.payment.create({
      data: {
        ticketId,
        methode,
        provider: this.provider.name,
        providerRef: intent.providerRef,
        montant: ticket.total,
        statut: 'pending',
      },
    });

    return { payment, launchUrl: intent.launchUrl, qr: intent.qr };
  }

  async handleWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    const event = this.provider.verifyWebhook(rawBody, headers);

    // Idempotence (CDC §5.4) : un événement déjà traité est ignoré.
    const existing = await this.prisma.paymentEvent.findUnique({
      where: { eventIdProvider: event.eventIdProvider },
    });
    if (existing) {
      this.logger.log(`Événement ${event.eventIdProvider} déjà traité — ignoré`);
      return { ignored: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: event.providerRef },
    });
    if (!payment) {
      throw new NotFoundException(
        `Aucun paiement pour la référence ${event.providerRef}`,
      );
    }

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventIdProvider: event.eventIdProvider,
        type: event.type,
        chargeUtile: event.raw as object,
        signatureValide: true,
      },
    });

    await this.applyOutcome(payment.id, event.type, event.frais);

    return { ignored: false };
  }

  // Réconciliation active (CDC §5.4) : interroge le prestataire pour les
  // paiements en attente depuis plus de 2 minutes, au cas où le webhook
  // serait arrivé en retard ou jamais.
  async reconcilePending() {
    const stale = await this.prisma.payment.findMany({
      where: {
        statut: 'pending',
        initieLe: { lt: new Date(Date.now() - RECONCILE_AFTER_MS) },
      },
    });

    for (const payment of stale) {
      if (!payment.providerRef) continue;
      try {
        const status = await this.provider.getStatus(payment.providerRef);
        if (status === 'succeeded') {
          await this.applyOutcome(payment.id, 'payment_completed', 0);
        } else if (status === 'failed' || status === 'expired') {
          await this.applyOutcome(
            payment.id,
            status === 'failed' ? 'payment_failed' : 'payment_expired',
            0,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Réconciliation échouée pour paiement ${payment.id}: ${(err as Error).message}`,
        );
      }
    }

    return { checked: stale.length };
  }

  listPending() {
    return this.prisma.payment.findMany({
      where: { statut: 'pending' },
      include: { ticket: true },
      orderBy: { initieLe: 'asc' },
    });
  }

  // Remboursement (CDC §5.4) : traçabilité + impact automatique sur points et
  // stock. Le virement réel au client se fait manuellement côté UnitechPay
  // (pas d'endpoint de remboursement documenté) — cet endpoint gère la
  // comptabilité interne, pas le mouvement d'argent.
  async refund(paymentId: string, motif: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { ticket: { include: { items: true } } },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.statut !== 'succeeded') {
      throw new ConflictException('Seul un paiement réussi peut être remboursé');
    }

    const ticket = payment.ticket;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { statut: 'refunded' },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { statut: 'rembourse', remiseMotif: motif },
      });

      for (const item of ticket.items) {
        if (!item.serviceId) continue;
        const consumed = await tx.serviceProduct.findMany({
          where: { serviceId: item.serviceId },
        });
        for (const c of consumed) {
          await tx.product.update({
            where: { id: c.productId },
            data: { quantite: { increment: c.quantiteConsommee * item.quantite } },
          });
          await tx.stockMovement.create({
            data: {
              productId: c.productId,
              type: 'entree',
              quantite: c.quantiteConsommee * item.quantite,
              ticketId: ticket.id,
              motif: `Remboursement ticket ${ticket.numero} — ${motif}`,
            },
          });
        }
      }

      if (ticket.clientId) {
        const pointsAnnules = Math.floor(ticket.total / 100);
        const account = await tx.loyaltyAccount.findUnique({
          where: { clientId: ticket.clientId },
        });
        if (account) {
          const points = Math.max(0, account.points - pointsAnnules);
          const palier = points >= 500 ? 'or' : points >= 200 ? 'argent' : 'bronze';
          await tx.loyaltyAccount.update({
            where: { clientId: ticket.clientId },
            data: {
              points,
              palier,
              totalDepense: { decrement: ticket.total },
            },
          });
          await tx.loyaltyTransaction.create({
            data: {
              clientId: ticket.clientId,
              ticketId: ticket.id,
              type: 'annulation',
              points: -pointsAnnules,
            },
          });
        }
      }
    });

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  // Chaîne d'états CDC §5.5 : « aucune transition arrière ». Un webhook en
  // retard ou reçu dans le désordre (ex. payment_completed après un
  // payment_failed déjà traité, ou après la réconciliation active) ne doit
  // jamais rouvrir un paiement déjà résolu — sans quoi la fidélité/le stock
  // pourraient être crédités deux fois ou à tort.
  private async applyOutcome(
    paymentId: string,
    type: 'payment_completed' | 'payment_failed' | 'payment_expired',
    frais: number,
  ) {
    const statut =
      type === 'payment_completed'
        ? 'succeeded'
        : type === 'payment_failed'
          ? 'failed'
          : 'expired';

    const current = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!current || current.statut !== 'pending') {
      this.logger.log(
        `Événement ${type} ignoré pour le paiement ${paymentId} — déjà résolu (${current?.statut ?? 'introuvable'})`,
      );
      return;
    }

    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        statut,
        frais,
        confirmeLe: statut === 'succeeded' ? new Date() : undefined,
      },
    });

    if (statut === 'succeeded') {
      await this.confirmTicketPayment(payment.ticketId);
    } else {
      // Santé des paiements (CDC §8) : un échec/expiration mérite une
      // alerte immédiate — le client est encore devant le coiffeur, mieux
      // vaut le détecter avant qu'il ne réclame.
      const ticket = await this.prisma.ticket.findUnique({ where: { id: payment.ticketId } });
      await this.telegram.notify(
        `💳 <b>Paiement ${statut === 'failed' ? 'échoué' : 'expiré'}</b>\nTicket #${ticket ? String(ticket.numero).padStart(5, '0') : payment.ticketId} — ${payment.methode}, ${payment.montant} F.`,
      );
    }
  }

  // Effets de bord d'un encaissement confirmé (CDC §4.4/§4.5) — décrément de
  // stock et crédit de fidélité. Partagé entre paiement espèces (immédiat,
  // TicketsService) et confirmation asynchrone (webhook/réconciliation).
  async confirmTicketPayment(ticketId: string) {
    const stockSummary: { productId: string; nom: string; quantite: number }[] = [];

    await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        include: { items: true },
      });

      if (ticket.statut === 'paye') return; // déjà confirmé (idempotence)

      await tx.ticket.update({
        where: { id: ticketId },
        data: { statut: 'paye', payeLe: new Date() },
      });

      // Décrément de stock groupé : une seule lecture des recettes (au lieu
      // d'une par article) puis un update par produit distinct — évite de
      // multiplier les allers-retours séquentiels vers le pool Supabase à
      // chaque encaissement.
      const serviceIds = [
        ...new Set(ticket.items.filter((i) => i.serviceId).map((i) => i.serviceId!)),
      ];
      if (serviceIds.length) {
        const consumedRows = await tx.serviceProduct.findMany({
          where: { serviceId: { in: serviceIds } },
          include: { product: { select: { nom: true } } },
        });
        const consumedByService = new Map<string, typeof consumedRows>();
        for (const row of consumedRows) {
          const arr = consumedByService.get(row.serviceId) ?? [];
          arr.push(row);
          consumedByService.set(row.serviceId, arr);
        }

        const decrementByProduct = new Map<string, { nom: string; qte: number }>();
        const movementRows: {
          productId: string;
          type: 'sortie';
          quantite: number;
          ticketId: string;
          motif: string;
        }[] = [];

        for (const item of ticket.items) {
          if (!item.serviceId) continue;
          for (const c of consumedByService.get(item.serviceId) ?? []) {
            const qte = c.quantiteConsommee * item.quantite;
            const existing = decrementByProduct.get(c.productId);
            decrementByProduct.set(c.productId, {
              nom: c.product.nom,
              qte: (existing?.qte ?? 0) + qte,
            });
            movementRows.push({
              productId: c.productId,
              type: 'sortie',
              quantite: qte,
              ticketId,
              motif: `Encaissement ticket ${ticket.numero}`,
            });
          }
        }

        for (const [productId, { nom, qte }] of decrementByProduct) {
          await tx.product.update({
            where: { id: productId },
            data: { quantite: { decrement: qte } },
          });
          stockSummary.push({ productId, nom, quantite: qte });
        }
        if (movementRows.length) {
          await tx.stockMovement.createMany({ data: movementRows });
        }
      }

      if (ticket.clientId) {
        const pointsGagnes = Math.floor(ticket.total / 100);
        const account = await tx.loyaltyAccount.findUnique({
          where: { clientId: ticket.clientId },
        });
        if (account) {
          const points = account.points + pointsGagnes;
          const palier = points >= 500 ? 'or' : points >= 200 ? 'argent' : 'bronze';
          await tx.loyaltyAccount.update({
            where: { clientId: ticket.clientId },
            data: {
              points,
              palier,
              totalDepense: { increment: ticket.total },
              derniereVisite: new Date(),
            },
          });
          await tx.loyaltyTransaction.create({
            data: {
              clientId: ticket.clientId,
              ticketId,
              type: 'gain',
              points: pointsGagnes,
            },
          });
        }
      }
    });

    if (stockSummary.length) {
      await this.audit.record({
        action: 'mouvement_stock',
        entite: 'ticket',
        entiteId: ticketId,
        apres: { type: 'sortie_auto', mouvements: stockSummary },
      });
    }
  }
}
