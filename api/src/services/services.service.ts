import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(categorieId?: string) {
    return this.prisma.service.findMany({
      where: {
        archivedAt: null,
        ...(categorieId ? { categorieId } : {}),
      },
      include: { categorie: true },
      orderBy: [{ categorie: { ordre: 'asc' } }, { nom: 'asc' }],
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, archivedAt: null },
      include: { categorie: true },
    });
    if (!service) throw new NotFoundException('Prestation introuvable');
    return service;
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  async update(id: string, actor: AuthenticatedUser, dto: UpdateServiceDto) {
    const before = await this.findOne(id);
    const updated = await this.prisma.service.update({ where: { id }, data: dto });

    if (dto.prix != null && dto.prix !== before.prix) {
      await this.audit.record({
        auteurId: actor.id,
        action: 'modification_prix',
        entite: 'service',
        entiteId: id,
        avant: { prix: before.prix, nom: before.nom },
        apres: { prix: updated.prix, nom: updated.nom },
      });
    }

    return updated;
  }

  // Suppression logique uniquement (CDC §6 — archived_at, jamais de DELETE).
  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: { archivedAt: new Date(), actif: false },
    });
  }
}
