import { Injectable } from '@nestjs/common';
import { PermissionValeur, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EffectivePermission {
  clePermission: string;
  valeur: PermissionValeur;
  plafond: number | null;
}

// Charge la matrice role_permissions (CDC §2.2) depuis la base et la met en cache
// en mémoire — invalidée explicitement à chaque écriture (PATCH /settings/permissions
// dans un lot futur). Le contrôle d'accès est toujours vérifié côté serveur (CDC §7).
@Injectable()
export class PermissionsService {
  private cache: Map<Role, Map<string, EffectivePermission>> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  invalidate() {
    this.cache = null;
  }

  private async loadCache() {
    if (this.cache) return this.cache;

    const rows = await this.prisma.rolePermission.findMany();
    const cache = new Map<Role, Map<string, EffectivePermission>>();

    for (const row of rows) {
      if (!cache.has(row.role)) cache.set(row.role, new Map());
      cache.get(row.role)!.set(row.clePermission, {
        clePermission: row.clePermission,
        valeur: row.valeur,
        plafond: row.plafond,
      });
    }

    this.cache = cache;
    return cache;
  }

  async getPermission(
    role: Role,
    cle: string,
  ): Promise<EffectivePermission | null> {
    const cache = await this.loadCache();
    return cache.get(role)?.get(cle) ?? null;
  }

  async isAllowed(role: Role, cle: string): Promise<boolean> {
    const perm = await this.getPermission(role, cle);
    return (
      perm?.valeur === PermissionValeur.oui ||
      perm?.valeur === PermissionValeur.limite
    );
  }

  async getEffectivePermissions(
    role: Role,
  ): Promise<Record<string, EffectivePermission>> {
    const cache = await this.loadCache();
    const roleMap = cache.get(role) ?? new Map();
    return Object.fromEntries(roleMap);
  }
}
