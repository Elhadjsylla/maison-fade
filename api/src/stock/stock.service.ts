import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAllProducts() {
    return this.prisma.product.findMany({
      where: { archivedAt: null },
      orderBy: { nom: 'asc' },
    });
  }

  async findProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, archivedAt: null },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  createProduct(dto: CreateProductDto, actor: AuthenticatedUser) {
    this.assertCanManageProducts(actor);
    return this.prisma.product.create({ data: dto });
  }

  async updateProduct(id: string, dto: UpdateProductDto, actor: AuthenticatedUser) {
    this.assertCanManageProducts(actor);
    await this.findProduct(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // Suppression logique uniquement (CDC §6 — archived_at, jamais de DELETE).
  async archiveProduct(id: string, actor: AuthenticatedUser) {
    this.assertCanManageProducts(actor);
    await this.findProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  // Fiche produit (prix, seuils, fournisseur) réservée à gérant/admin — le
  // coiffeur ne fait que déclarer une consommation via POST /stock/movements.
  private assertCanManageProducts(actor: AuthenticatedUser) {
    if (actor.role === 'coiffeur') {
      throw new ForbiddenException(
        'La gestion des fiches produit est réservée à un gérant ou un administrateur',
      );
    }
  }

  listMovements(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { productId },
      include: {
        product: { select: { nom: true } },
        auteur: { select: { id: true, nom: true, role: true } },
      },
      orderBy: { creeLe: 'desc' },
      take: 200,
    });
  }

  // CDC §2.2 : un coiffeur ne peut que déclarer une consommation (sortie),
  // jamais une entrée/perte/inventaire — réservées à gérant/admin.
  async createMovement(dto: CreateStockMovementDto, actor: AuthenticatedUser) {
    if (actor.role === 'coiffeur') {
      if (dto.type !== 'sortie') {
        throw new ForbiddenException(
          'Un coiffeur ne peut que déclarer une consommation (sortie de stock)',
        );
      }
      if (!dto.motif) {
        throw new BadRequestException('Motif requis pour déclarer une consommation');
      }
    }

    const product = await this.findProduct(dto.productId);

    let nouvelleQuantite: number;
    let quantiteMouvement: number;
    let ecart: number | undefined;

    if (dto.type === 'inventaire') {
      // `quantite` = nouveau compte physique total, pas un delta.
      ecart = dto.quantite - product.quantite;
      nouvelleQuantite = dto.quantite;
      quantiteMouvement = Math.abs(ecart);
    } else if (dto.type === 'entree') {
      nouvelleQuantite = product.quantite + dto.quantite;
      quantiteMouvement = dto.quantite;
    } else {
      // sortie | perte
      nouvelleQuantite = product.quantite - dto.quantite;
      quantiteMouvement = dto.quantite;
    }

    const [updated, movement] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { quantite: nouvelleQuantite },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantite: quantiteMouvement,
          auteurId: actor.id,
          motif: dto.motif,
        },
      }),
    ]);

    await this.audit.record({
      auteurId: actor.id,
      action: 'mouvement_stock',
      entite: 'product',
      entiteId: dto.productId,
      avant: { quantite: product.quantite },
      apres: {
        type: 'manuel',
        mouvementType: dto.type,
        quantite: updated.quantite,
        ecart,
        motif: dto.motif,
        produit: product.nom,
      },
    });

    return { product: updated, movement };
  }
}
