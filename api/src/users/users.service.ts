import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

// Gestion des comptes de l'équipe (CDC §2.2/§4.1), réservée au rôle disposant
// de la permission "users" (admin par défaut, cf. seed.ts). Suppression
// toujours logique (actif=false + archivedAt) — jamais de DELETE métier, en
// cohérence avec le reste du schéma.
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listAll(salonId: string) {
    return this.prisma.user.findMany({
      where: { salonId },
      select: {
        id: true,
        nom: true,
        login: true,
        role: true,
        actif: true,
        archivedAt: true,
        dernierAcces: true,
        creeLe: true,
      },
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
    });
  }

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    const login = dto.login.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { login } });
    if (existing) {
      throw new ConflictException('Cet identifiant est déjà utilisé');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        salonId: actor.salonId,
        nom: dto.nom.trim(),
        login,
        role: dto.role,
        passwordHash,
      },
      select: { id: true, nom: true, login: true, role: true, actif: true, creeLe: true },
    });

    await this.audit.record({
      auteurId: actor.id,
      action: 'creation_compte',
      entite: 'user',
      entiteId: user.id,
      apres: { nom: user.nom, login: user.login, role: user.role },
    });

    return user;
  }

  async archive(userId: string, actor: AuthenticatedUser) {
    if (userId === actor.id) {
      throw new ForbiddenException('Impossible de désactiver son propre compte');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: userId, salonId: actor.salonId },
    });
    if (!user) throw new NotFoundException('Compte introuvable');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { actif: false, archivedAt: new Date() },
      select: { id: true, nom: true, login: true, role: true, actif: true },
    });

    await this.audit.record({
      auteurId: actor.id,
      action: 'desactivation_compte',
      entite: 'user',
      entiteId: userId,
      avant: { actif: true },
      apres: { actif: false, nom: user.nom, login: user.login },
    });

    return updated;
  }

  async restore(userId: string, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, salonId: actor.salonId },
    });
    if (!user) throw new NotFoundException('Compte introuvable');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        actif: true,
        archivedAt: null,
        echecsConnexion: 0,
        verrouilleJusqua: null,
      },
      select: { id: true, nom: true, login: true, role: true, actif: true },
    });

    await this.audit.record({
      auteurId: actor.id,
      action: 'reactivation_compte',
      entite: 'user',
      entiteId: userId,
      avant: { actif: false },
      apres: { actif: true, nom: user.nom, login: user.login },
    });

    return updated;
  }
}
