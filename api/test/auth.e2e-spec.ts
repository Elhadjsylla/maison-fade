import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Nécessite une base PostgreSQL migrée et accessible via DATABASE_URL
// (docker compose up -d && npm run prisma:migrate). Non exécuté en CI sans base.
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const deviceId = 'e2e-test-device';
  const pin = '9999';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const salon = await prisma.salon.upsert({
      where: { id: '00000000-0000-0000-0000-0000000000e2' },
      create: { id: '00000000-0000-0000-0000-0000000000e2', nom: 'E2E Salon' },
      update: {},
    });

    const pinHash = await argon2.hash(pin, { type: argon2.argon2id });
    const user = await prisma.user.upsert({
      where: { login: 'e2e-jaz' },
      create: {
        salonId: salon.id,
        login: 'e2e-jaz',
        nom: 'Jaz (E2E)',
        role: 'coiffeur',
        pinHash,
      },
      update: { pinHash },
    });

    await prisma.device.upsert({
      where: { empreinte: deviceId },
      create: {
        userId: user.id,
        empreinte: deviceId,
        libelle: 'Appareil E2E',
        approuve: true,
      },
      update: { approuve: true, userId: user.id },
    });

    for (const cle of ['rdv.lire', 'services.lire']) {
      await prisma.rolePermission.upsert({
        where: { role_clePermission: { role: 'coiffeur', clePermission: cle } },
        create: { role: 'coiffeur', clePermission: cle, valeur: 'oui' },
        update: { valeur: 'oui' },
      });
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { login: 'e2e-jaz' } });
    await app.close();
  });

  it('POST /auth/login réussit avec le bon PIN sur un appareil approuvé', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: 'e2e-jaz', pin, deviceId })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('GET /me renvoie le profil et les permissions effectives', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: 'e2e-jaz', pin, deviceId })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(res.body.login).toBe('e2e-jaz');
    expect(res.body.permissions['rdv.lire'].valeur).toBe('oui');
  });

  it('verrouille le compte après 5 échecs de PIN', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ login: 'e2e-jaz', pin: '0000', deviceId })
        .expect(401);
    }

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: 'e2e-jaz', pin, deviceId })
      .expect(401);

    expect(res.body.message).toMatch(/verrouillé/i);
  });
});
