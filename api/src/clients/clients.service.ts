import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  search(q?: string) {
    return this.prisma.client.findMany({
      where: {
        archivedAt: null,
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { telephone: { contains: q } },
              ],
            }
          : {}),
      },
      include: { loyaltyAccount: true },
      orderBy: { nom: 'asc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, archivedAt: null },
      include: { loyaltyAccount: true },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async create(dto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({
      where: { telephone: dto.telephone },
    });
    if (existing) {
      throw new ConflictException('Un client existe déjà avec ce téléphone');
    }

    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: dto as Prisma.ClientUncheckedCreateInput,
      });

      // Carte de fidélité numérique MF-XXXX (CDC §4.5), palier Bronze par défaut.
      let numeroCarte = '';
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = Math.floor(1000 + Math.random() * 9000);
        const candidate = `MF-${code}`;
        const taken = await tx.loyaltyAccount.findUnique({
          where: { numeroCarte: candidate },
        });
        if (!taken) {
          numeroCarte = candidate;
          break;
        }
      }

      await tx.loyaltyAccount.create({
        data: { clientId: client.id, numeroCarte, palier: 'bronze' },
      });

      return tx.client.findUniqueOrThrow({
        where: { id: client.id },
        include: { loyaltyAccount: true },
      });
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: dto as Prisma.ClientUncheckedUpdateInput,
    });
  }

  async getLoyalty(clientId: string) {
    await this.findOne(clientId);
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { clientId },
    });
    if (!account) throw new NotFoundException('Compte fidélité introuvable');

    // Pas de relation Prisma directe LoyaltyAccount -> LoyaltyTransaction
    // (les deux référencent Client indépendamment) — requête séparée.
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { clientId },
      orderBy: { creeLe: 'desc' },
      take: 20,
    });

    return { ...account, transactions };
  }

  // Droit d'accès (CDC §10, loi sénégalaise n° 2008-12) : toutes les données
  // personnelles détenues sur ce client, en un seul export.
  async exportData(clientId: string, actor: AuthenticatedUser) {
    const client = await this.findOne(clientId);
    const [loyaltyTransactions, tickets, appointments, reviews] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({ where: { clientId }, orderBy: { creeLe: 'desc' } }),
      this.prisma.ticket.findMany({
        where: { clientId },
        include: { items: true },
        orderBy: { creeLe: 'desc' },
      }),
      this.prisma.appointment.findMany({ where: { clientId }, orderBy: { debut: 'desc' } }),
      this.prisma.review.findMany({ where: { clientId }, orderBy: { publieLe: 'desc' } }),
    ]);

    await this.audit.record({
      auteurId: actor.id,
      action: 'export_donnees_client',
      entite: 'client',
      entiteId: clientId,
      apres: { demandePar: actor.nom },
    });

    return { client, loyaltyTransactions, tickets, appointments, reviews };
  }

  // Droit de suppression (CDC §10) — anonymise l'identité du client (nom,
  // téléphone, notes, préférences) tout en conservant les tickets/mouvements
  // de fidélité déjà émis : ce sont des pièces comptables soumises à une
  // conservation légale de 10 ans (CDC §4.4/§10), pas des données
  // personnelles au sens strict une fois l'identité effacée. Réservé à
  // l'admin — action irréversible.
  async erase(clientId: string, actor: AuthenticatedUser) {
    if (actor.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut effacer une fiche client');
    }
    const client = await this.findOne(clientId);

    const anonymized = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        nom: 'Client supprimé',
        telephone: `supprime-${randomUUID()}`,
        notes: null,
        preferences: Prisma.JsonNull,
        coiffeurPrefereId: null,
        consentementSms: false,
        archivedAt: new Date(),
      },
    });

    await this.audit.record({
      auteurId: actor.id,
      action: 'suppression_client',
      entite: 'client',
      entiteId: clientId,
      avant: { nom: client.nom, telephone: client.telephone },
      apres: { nom: 'Client supprimé' },
    });

    return anonymized;
  }
}
