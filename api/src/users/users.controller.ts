import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionsService } from '../common/permissions.service';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly permissions: PermissionsService) {}

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
}
