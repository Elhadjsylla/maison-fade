import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  login: string;
  nom: string;
  role: Role;
  salonId: string;
  deviceId: string;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  salonId: string;
  deviceId: string;
}
