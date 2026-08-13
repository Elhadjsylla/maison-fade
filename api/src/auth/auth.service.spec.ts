import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let auth: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    device: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const baseUser = {
    id: 'user-1',
    login: 'palaye',
    nom: 'Pa Laye',
    role: 'coiffeur' as const,
    salonId: 'salon-1',
    actif: true,
    echecsConnexion: 0,
    verrouilleJusqua: null as Date | null,
    pinHash: null as string | null,
    passwordHash: null as string | null,
  };

  const baseDevice = {
    id: 'device-1',
    userId: 'user-1',
    empreinte: 'device-fingerprint',
    libelle: 'Tablette caisse',
    approuve: true,
    refreshTokenHash: null as string | null,
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      device: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed.jwt') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                AUTH_MAX_FAILED_ATTEMPTS: '5',
                AUTH_LOCKOUT_MINUTES: '5',
                JWT_ACCESS_SECRET: 'test-secret',
                JWT_ACCESS_TTL: '15m',
              })[key],
          },
        },
      ],
    }).compile();

    auth = moduleRef.get(AuthService);
  });

  it('connecte avec un PIN correct sur un appareil approuvé', async () => {
    const pinHash = await argon2.hash('3456', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, pinHash });
    prisma.device.findUnique.mockResolvedValue(baseDevice);
    prisma.user.update.mockResolvedValue({});
    prisma.device.update.mockResolvedValue({});

    const result = await auth.login({
      login: 'palaye',
      pin: '3456',
      deviceId: 'device-fingerprint',
    });

    expect(result.accessToken).toBe('signed.jwt');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        echecsConnexion: 0,
        verrouilleJusqua: null,
        dernierAcces: expect.any(Date),
      },
    });
  });

  it('refuse un PIN incorrect et incrémente le compteur d\'échecs', async () => {
    const pinHash = await argon2.hash('3456', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, pinHash });
    prisma.device.findUnique.mockResolvedValue(baseDevice);
    prisma.user.update.mockResolvedValue({});

    await expect(
      auth.login({
        login: 'palaye',
        pin: '0000',
        deviceId: 'device-fingerprint',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { echecsConnexion: 1, verrouilleJusqua: null },
    });
  });

  it('verrouille le compte après 5 échecs consécutifs', async () => {
    const pinHash = await argon2.hash('3456', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      pinHash,
      echecsConnexion: 4,
    });
    prisma.device.findUnique.mockResolvedValue(baseDevice);
    prisma.user.update.mockResolvedValue({});

    await expect(
      auth.login({
        login: 'palaye',
        pin: '0000',
        deviceId: 'device-fingerprint',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        echecsConnexion: 0,
        verrouilleJusqua: expect.any(Date),
      },
    });
  });

  it('rejette toute tentative tant que le compte est verrouillé', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      verrouilleJusqua: new Date(Date.now() + 60_000),
    });

    await expect(
      auth.login({
        login: 'palaye',
        pin: '3456',
        deviceId: 'device-fingerprint',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.device.findUnique).not.toHaveBeenCalled();
  });

  it('refuse le PIN sur un appareil non approuvé', async () => {
    const pinHash = await argon2.hash('3456', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, pinHash });
    prisma.device.findUnique.mockResolvedValue({
      ...baseDevice,
      approuve: false,
    });
    prisma.user.update.mockResolvedValue({});

    await expect(
      auth.login({
        login: 'palaye',
        pin: '3456',
        deviceId: 'device-fingerprint',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
