import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
