import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  auteurId?: string | null;
  action: string;
  entite: string;
  entiteId?: string | null;
  avant?: unknown;
  apres?: unknown;
  ip?: string | null;
  deviceId?: string | null;
}

export interface AuditFilters {
  auteurId?: string;
  action?: string;
  from?: string;
  to?: string;
}

// Journal d'activité append-only (CDC §2.3/§4.9) — chaîne d'intégrité par
// empreinte du bloc précédent : toute réécriture rétroactive d'une ligne
// casse la chaîne à partir de ce point. La tête de chaîne est verrouillée
// (SELECT ... FOR UPDATE sur une ligne singleton) à chaque écriture pour
// qu'aucune paire d'écritures concurrentes ne puisse se référer au même bloc
// précédent et former une chaîne fourchue.
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const [head] = await tx.$queryRaw<{ derniere_empreinte: string | null }[]>`
          SELECT derniere_empreinte FROM audit_chain_head WHERE id = 'default' FOR UPDATE
        `;
        const empreintePrecedente = head?.derniere_empreinte ?? null;
        const horodatage = new Date();
        const empreinte = this.hash(entry, horodatage, empreintePrecedente);

        await tx.auditLog.create({
          data: {
            auteurId: entry.auteurId ?? undefined,
            action: entry.action,
            entite: entry.entite,
            entiteId: entry.entiteId ?? undefined,
            avant: (entry.avant ?? undefined) as Prisma.InputJsonValue,
            apres: (entry.apres ?? undefined) as Prisma.InputJsonValue,
            ip: entry.ip ?? undefined,
            deviceId: entry.deviceId ?? undefined,
            horodatage,
            empreinte,
            empreintePrecedente,
          },
        });

        await tx.auditChainHead.update({
          where: { id: 'default' },
          data: { derniereEmpreinte: empreinte },
        });
      });
    } catch (err) {
      // Une écriture de journal ne doit jamais faire échouer l'action métier
      // qu'elle constate (remise, clôture, etc.) — on trace l'incident et on continue.
      this.logger.error(
        `Écriture du journal échouée (${entry.action}): ${(err as Error).message}`,
      );
    }
  }

  private hash(
    entry: AuditEntry,
    horodatage: Date,
    empreintePrecedente: string | null,
  ): string {
    const payload = JSON.stringify({
      action: entry.action,
      entite: entry.entite,
      entiteId: entry.entiteId ?? null,
      avant: entry.avant ?? null,
      apres: entry.apres ?? null,
      horodatage: horodatage.toISOString(),
      empreintePrecedente,
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  findAll(filters: AuditFilters) {
    return this.prisma.auditLog.findMany({
      where: {
        auteurId: filters.auteurId,
        action: filters.action,
        horodatage: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      include: { auteur: { select: { id: true, nom: true, role: true } } },
      orderBy: { horodatage: 'desc' },
      take: 500,
    });
  }
}
