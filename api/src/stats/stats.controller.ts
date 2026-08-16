import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StatsService } from './stats.service';
import type { AuthenticatedUser } from '../auth/auth.types';

function defaultRange(): { from: string; to: string } {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  // stats.perso passe pour les 3 rôles (coiffeur en « limite ») — un coiffeur
  // ne voit jamais que ses propres chiffres, quoi qu'il mette en paramètre
  // (CDC §2.2 : « 🔸 les siennes »).
  @Get('stats/overview')
  @Permissions('stats.perso')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('coiffeur') coiffeur?: string,
  ) {
    const range = { from: from ?? defaultRange().from, to: to ?? defaultRange().to };
    const coiffeurId = user.role === 'coiffeur' ? user.id : coiffeur;
    return this.stats.overview(user.salonId, range.from, range.to, coiffeurId);
  }

  @Get('admin/360')
  @Permissions('admin360')
  supervision360(@CurrentUser() user: AuthenticatedUser) {
    return this.stats.supervision360(user.salonId);
  }

  // Série jour par jour pour le graphique "Recettes de la semaine" (tableau
  // de bord + poste de commande) — mêmes règles de portée que /stats/overview
  // (un coiffeur ne voit que ses propres chiffres, CDC §2.2).
  @Get('stats/daily')
  @Permissions('stats.perso')
  daily(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    const n = Math.min(31, Math.max(1, Number(days) || 7));
    const coiffeurId = user.role === 'coiffeur' ? user.id : undefined;
    return this.stats.dailySeries(user.salonId, n, coiffeurId);
  }
}
