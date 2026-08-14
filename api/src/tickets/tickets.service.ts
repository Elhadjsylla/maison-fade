import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketItemDto } from './dto/add-ticket-item.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { PayTicketDto } from './dto/pay-ticket.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

const TICKET_INCLUDE = {
  items: true,
  payments: true,
  client: { include: { loyaltyAccount: true } },
  coiffeur: { select: { id: true, nom: true, login: true, role: true } },
} as const;

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    return ticket;
  }

  async create(salonId: string, encaisseParId: string, dto: CreateTicketDto) {
    const session = await this.prisma.cashSession.findFirst({
      where: { salonId, fermeLe: null },
    });
    if (!session) {
      throw new ConflictException('Aucune session de caisse ouverte');
    }

    const coiffeur = await this.prisma.user.findFirst({
      where: { id: dto.coiffeurId, role: 'coiffeur', actif: true },
    });
    if (!coiffeur) {
      throw new BadRequestException(
        'Le ticket doit être rattaché à un coiffeur actif',
      );
    }

    // Numérotation séquentielle sans trou (CDC §4.4) — UPDATE...RETURNING
    // atomique, jamais un lu-puis-écrit côté application.
    const [{ dernier }] = await this.prisma.$queryRaw<{ dernier: number }[]>`
      UPDATE ticket_counters SET dernier = dernier + 1
      WHERE salon_id = ${salonId}
      RETURNING dernier
    `;

    const ticket = await this.prisma.ticket.create({
      data: {
        numero: dernier,
        sessionId: session.id,
        clientId: dto.clientId,
        coiffeurId: dto.coiffeurId,
        encaisseParId,
        sousTotal: 0,
        total: 0,
      },
      include: TICKET_INCLUDE,
    });

    return ticket;
  }

  async addItem(ticketId: string, dto: AddTicketItemDto) {
    const ticket = await this.assertOuvert(ticketId);

    if (!dto.serviceId && !dto.productId) {
      throw new BadRequestException('serviceId ou productId requis');
    }
    if (dto.serviceId && dto.productId) {
      throw new BadRequestException('Choisir serviceId OU productId, pas les deux');
    }

    const quantite = dto.quantite ?? 1;
    let libelle: string;
    let prixUnitaire: number;

    if (dto.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, archivedAt: null, actif: true },
      });
      if (!service) throw new NotFoundException('Prestation introuvable');
      libelle = service.nom;
      prixUnitaire = service.prix;
    } else {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, archivedAt: null },
      });
      if (!product) throw new NotFoundException('Produit introuvable');
      libelle = product.nom;
      prixUnitaire = product.prixVente ?? 0;
    }

    await this.prisma.ticketItem.create({
      data: {
        ticketId: ticket.id,
        serviceId: dto.serviceId,
        productId: dto.productId,
        libelle,
        prixUnitaire,
        quantite,
        total: prixUnitaire * quantite,
      },
    });

    return this.recomputeTotals(ticket.id);
  }

  async removeItem(ticketId: string, itemId: string) {
    await this.assertOuvert(ticketId);

    const item = await this.prisma.ticketItem.findFirst({
      where: { id: itemId, ticketId },
    });
    if (!item) throw new NotFoundException('Ligne de ticket introuvable');

    await this.prisma.ticketItem.delete({ where: { id: itemId } });
    return this.recomputeTotals(ticketId);
  }

  async applyDiscount(
    ticketId: string,
    dto: ApplyDiscountDto,
    actor: AuthenticatedUser,
  ) {
    const ticket = await this.assertOuvert(ticketId);

    if (!dto.montant && !dto.pourcent) {
      throw new BadRequestException('montant ou pourcent requis');
    }

    const remiseMontant = dto.montant ?? Math.round((ticket.sousTotal * dto.pourcent!) / 100);
    const pourcentEffectif =
      ticket.sousTotal > 0 ? (remiseMontant / ticket.sousTotal) * 100 : 0;

    // Motif obligatoire au-delà de 10 % quel que soit le rôle (CDC §4.4).
    if (pourcentEffectif > 10 && !dto.motif) {
      throw new BadRequestException(
        'Un motif est obligatoire pour une remise supérieure à 10 %',
      );
    }

    const actorPlafond = await this.getRemisePlafond(actor.role);
    if (pourcentEffectif > actorPlafond) {
      await this.assertEscalation(dto.authorization, pourcentEffectif);
    }

    const total = Math.max(0, ticket.sousTotal - remiseMontant);

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { remiseMontant, remiseMotif: dto.motif, total },
    });

    return this.findOne(ticketId);
  }

  async pay(ticketId: string, dto: PayTicketDto) {
    const ticket = await this.assertOuvert(ticketId);

    if (dto.montant !== ticket.total) {
      throw new BadRequestException(
        `Le montant (${dto.montant} F) ne correspond pas au total du ticket (${ticket.total} F) — paiement mixte non pris en charge`,
      );
    }

    const succeeded = dto.methode === 'especes';

    const payment = await this.prisma.payment.create({
      data: {
        ticketId,
        methode: dto.methode,
        montant: dto.montant,
        statut: succeeded ? 'succeeded' : 'pending',
        confirmeLe: succeeded ? new Date() : null,
      },
    });

    if (!succeeded) {
      // Wave/Orange Money/Free Money/carte : intention créée, confirmation
      // réelle via webhook — lot L4 Paiements Sénégal.
      return { ticket: await this.findOne(ticketId), payment };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { statut: 'paye', payeLe: new Date() },
      });

      const items = await tx.ticketItem.findMany({ where: { ticketId } });
      for (const item of items) {
        if (!item.serviceId) continue;
        const consumed = await tx.serviceProduct.findMany({
          where: { serviceId: item.serviceId },
        });
        for (const c of consumed) {
          await tx.product.update({
            where: { id: c.productId },
            data: { quantite: { decrement: c.quantiteConsommee * item.quantite } },
          });
          await tx.stockMovement.create({
            data: {
              productId: c.productId,
              type: 'sortie',
              quantite: c.quantiteConsommee * item.quantite,
              ticketId,
              motif: `Encaissement ticket ${ticket.numero}`,
            },
          });
        }
      }

      if (ticket.clientId) {
        // Points crédités uniquement après paiement confirmé (CDC §4.5) —
        // 1 point / 100 F, paliers Bronze/Argent(200pts)/Or(500pts).
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

    return {
      ticket: await this.findOne(ticketId),
      payment,
      rendu: dto.recu != null ? dto.recu - dto.montant : undefined,
    };
  }

  async cancel(ticketId: string, dto: CancelTicketDto) {
    const ticket = await this.assertOuvert(ticketId);
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { statut: 'annule', remiseMotif: dto.motif },
    });
    return this.findOne(ticketId);
  }

  private async assertOuvert(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    if (ticket.statut !== 'ouvert') {
      throw new ConflictException(
        'Un ticket payé, annulé ou remboursé n\'est jamais modifiable',
      );
    }
    return ticket;
  }

  private async recomputeTotals(ticketId: string) {
    const items = await this.prisma.ticketItem.findMany({ where: { ticketId } });
    const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    const sousTotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = Math.max(0, sousTotal - ticket.remiseMontant);

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { sousTotal, total },
    });

    return this.findOne(ticketId);
  }

  private async getRemisePlafond(role: string) {
    const perm = await this.prisma.rolePermission.findUnique({
      where: { role_clePermission: { role: role as never, clePermission: 'caisse.remise' } },
    });
    return perm?.plafond ?? 0;
  }

  // Déblocage d'une remise au-delà du plafond par saisie du PIN d'un
  // gérant/admin habilité (CDC §2.3) — pas de notification asynchrone en V1.
  private async assertEscalation(
    authorization: ApplyDiscountDto['authorization'],
    pourcentEffectif: number,
  ) {
    if (!authorization) {
      throw new ForbiddenException(
        'Remise au-delà du plafond — autorisation d\'un gérant ou admin requise',
      );
    }

    const approver = await this.prisma.user.findUnique({
      where: { login: authorization.login },
    });
    if (
      !approver ||
      !approver.actif ||
      (approver.role !== 'gerant' && approver.role !== 'admin') ||
      !approver.pinHash ||
      !(await argon2.verify(approver.pinHash, authorization.pin))
    ) {
      throw new UnauthorizedException('Autorisation invalide');
    }

    const approverPlafond = await this.getRemisePlafond(approver.role);
    if (pourcentEffectif > approverPlafond) {
      throw new ForbiddenException(
        `${approver.nom} n'est pas habilité à autoriser une remise de ${pourcentEffectif.toFixed(0)} %`,
      );
    }
  }
}
