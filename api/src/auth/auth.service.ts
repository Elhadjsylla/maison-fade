import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Device, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtPayload } from './auth.types';

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  private readonly maxFailedAttempts: number;
  private readonly lockoutMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {
    this.maxFailedAttempts = Number(
      this.config.get('AUTH_MAX_FAILED_ATTEMPTS') ?? 5,
    );
    this.lockoutMinutes = Number(
      this.config.get('AUTH_LOCKOUT_MINUTES') ?? 5,
    );
  }

  async login(dto: LoginDto): Promise<TokenBundle> {
    if (!dto.pin && !dto.password) {
      throw new UnprocessableEntityException(
        'Fournir un PIN (appareil enregistré) ou un mot de passe',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    // Réponse volontairement identique (utilisateur inconnu vs mauvais secret)
    // pour ne pas révéler l'existence d'un compte.
    if (!user || !user.actif) {
      await this.audit.record({
        auteurId: user?.id ?? null,
        action: 'connexion_echouee',
        entite: 'user',
        entiteId: user?.id ?? null,
        apres: { login: dto.login, raison: !user ? 'compte_inconnu' : 'compte_desactive' },
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.assertNotLocked(user);

    let device = await this.prisma.device.findUnique({
      where: { empreinte: dto.deviceId },
    });

    if (dto.pin) {
      // PIN uniquement autorisé sur un appareil déjà enregistré et approuvé.
      if (!device || device.userId !== user.id || !device.approuve) {
        await this.registerFailedAttempt(user, 'appareil_non_approuve');
        throw new UnauthorizedException(
          'PIN refusé sur cet appareil — utilisez votre mot de passe',
        );
      }
      const valid =
        user.pinHash && (await argon2.verify(user.pinHash, dto.pin));
      if (!valid) {
        await this.registerFailedAttempt(user, 'pin_invalide');
        throw new UnauthorizedException('Identifiants invalides');
      }
    } else {
      const valid =
        user.passwordHash &&
        (await argon2.verify(user.passwordHash, dto.password!));
      if (!valid) {
        await this.registerFailedAttempt(user, 'mot_de_passe_invalide');
        throw new UnauthorizedException('Identifiants invalides');
      }
      // Appareil inconnu : on l'enregistre, en attente d'approbation admin
      // (CDC §4.1 — enrôlement validé par Bamba). Le mot de passe suffit à
      // obtenir un access token immédiat, mais /auth/refresh restera bloqué
      // tant que l'appareil n'est pas approuvé : au-delà de 15 min, une
      // nouvelle connexion par mot de passe est nécessaire jusqu'à l'approbation.
      if (!device) {
        device = await this.prisma.device.create({
          data: {
            userId: user.id,
            empreinte: dto.deviceId,
            libelle: dto.deviceLabel ?? 'Appareil non nommé',
            approuve: false,
          },
        });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        echecsConnexion: 0,
        verrouilleJusqua: null,
        dernierAcces: new Date(),
      },
    });

    await this.audit.record({
      auteurId: user.id,
      action: 'connexion_reussie',
      entite: 'user',
      entiteId: user.id,
      apres: { login: user.login, role: user.role },
      deviceId: dto.deviceId,
    });

    return this.issueTokens(user, device);
  }

  async refresh(dto: RefreshDto): Promise<TokenBundle> {
    const device = await this.prisma.device.findUnique({
      where: { empreinte: dto.deviceId },
      include: { user: true },
    });

    if (!device || !device.refreshTokenHash || !device.approuve) {
      throw new UnauthorizedException('Session invalide');
    }

    const valid = await argon2.verify(
      device.refreshTokenHash,
      dto.refreshToken,
    );
    if (!valid) throw new UnauthorizedException('Session invalide');

    if (!device.user.actif) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return this.issueTokens(device.user, device);
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.prisma.device.updateMany({
      where: { userId, empreinte: deviceId },
      data: { refreshTokenHash: null },
    });
  }

  private async assertNotLocked(user: User) {
    if (user.verrouilleJusqua && user.verrouilleJusqua > new Date()) {
      await this.audit.record({
        auteurId: user.id,
        action: 'connexion_echouee',
        entite: 'user',
        entiteId: user.id,
        apres: { login: user.login, raison: 'compte_verrouille' },
      });
      throw new UnauthorizedException(
        `Compte verrouillé jusqu'à ${user.verrouilleJusqua.toISOString()}`,
      );
    }
  }

  private async registerFailedAttempt(user: User, raison: string): Promise<void> {
    const attempts = user.echecsConnexion + 1;
    const locked = attempts >= this.maxFailedAttempts;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        echecsConnexion: locked ? 0 : attempts,
        verrouilleJusqua: locked
          ? new Date(Date.now() + this.lockoutMinutes * 60_000)
          : user.verrouilleJusqua,
      },
    });

    await this.audit.record({
      auteurId: user.id,
      action: 'connexion_echouee',
      entite: 'user',
      entiteId: user.id,
      apres: { login: user.login, raison, verrouille: locked },
    });
  }

  private async issueTokens(
    user: User,
    device: Device,
  ): Promise<TokenBundle> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      salonId: user.salonId,
      deviceId: device.empreinte,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m',
    });

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = await argon2.hash(refreshToken);

    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        refreshTokenHash,
        derniereUtilisation: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m',
    };
  }
}
