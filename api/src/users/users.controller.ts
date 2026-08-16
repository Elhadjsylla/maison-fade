import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionsService } from '../common/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  // Profil + permissions effectives (CDC §7 — GET /me).
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const permissions = await this.permissions.getEffectivePermissions(
      user.role,
    );

    return {
      id: user.id,
      login: user.login,
      nom: user.nom,
      role: user.role,
      salonId: user.salonId,
      permissions,
    };
  }

  // Liste minimale (sans hash) pour peupler les sélecteurs caisse/rendez-vous
  // — ex. GET /users?role=coiffeur. Jamais de pin_hash/password_hash exposés.
  @Get('users')
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('role') role?: Role,
  ) {
    return this.prisma.user.findMany({
      where: {
        salonId: actor.salonId,
        actif: true,
        archivedAt: null,
        ...(role ? { role } : {}),
      },
      select: { id: true, nom: true, login: true, role: true },
      orderBy: { nom: 'asc' },
    });
  }

  // Gestion des comptes (CDC §2.2/§4.1) — ajouter/retirer une personne du
  // personnel, réservé à la permission "users" (admin par défaut).
  @Get('users/all')
  @Permissions('users')
  listAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.users.listAll(actor.salonId);
  }

  @Post('users')
  @Permissions('users')
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.users.create(dto, actor);
  }

  @Patch('users/:id/archive')
  @Permissions('users')
  archive(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.users.archive(id, actor);
  }

  @Patch('users/:id/restore')
  @Permissions('users')
  restore(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.users.restore(id, actor);
  }
}
