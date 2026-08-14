import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({ where: { id }, data: dto });
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
