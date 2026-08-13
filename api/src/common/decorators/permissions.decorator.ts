import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// @Permissions('caisse.remise') — clés du CDC §2.2, contrôlées côté serveur par PermissionsGuard.
export const Permissions = (...keys: string[]) =>
  SetMetadata(PERMISSIONS_KEY, keys);
