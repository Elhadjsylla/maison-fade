import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../permissions.service';
import type { AuthenticatedUser } from '../../auth/auth.types';

// Vérifie côté serveur qu'un utilisateur authentifié possède chacune des
// permissions requises par @Permissions(...) sur la route (CDC §7 : masquer
// un bouton côté client n'est jamais une sécurité).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) throw new ForbiddenException('Non authentifié');

    for (const cle of required) {
      const allowed = await this.permissions.isAllowed(user.role, cle);
      if (!allowed) {
        throw new ForbiddenException(
          `Permission refusée : ${cle} (rôle ${user.role})`,
        );
      }
    }

    return true;
  }
}
