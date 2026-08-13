import { PrismaClient, Role, PermissionValeur } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Matrice permission × rôle — CDC §2.2. Les plafonds (ex. remise max) sont
// paramétrables par Bamba depuis /settings dans un lot futur, jamais codés en dur.
const PERMISSION_MATRIX: Array<{
  cle: string;
  admin: PermissionValeur;
  gerant: PermissionValeur;
  coiffeur: PermissionValeur;
  plafond?: { admin?: number; gerant?: number; coiffeur?: number };
}> = [
  { cle: 'caisse.session', admin: 'oui', gerant: 'oui', coiffeur: 'non' },
  { cle: 'caisse.encaisser', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  {
    cle: 'caisse.remise',
    admin: 'oui',
    gerant: 'oui',
    coiffeur: 'limite',
    plafond: { admin: 100, gerant: 30, coiffeur: 10 },
  },
  { cle: 'caisse.annuler', admin: 'oui', gerant: 'limite', coiffeur: 'non' },
  { cle: 'rdv.lire', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'rdv.ecrire', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'clients.lire', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'clients.ecrire', admin: 'oui', gerant: 'oui', coiffeur: 'non' },
  { cle: 'fidelite.ajuster', admin: 'oui', gerant: 'non', coiffeur: 'non' },
  { cle: 'services.lire', admin: 'oui', gerant: 'oui', coiffeur: 'oui' },
  { cle: 'services.ecrire', admin: 'oui', gerant: 'non', coiffeur: 'non' },
  { cle: 'stock.ecrire', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'staff.gerer', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'stats.salon', admin: 'oui', gerant: 'oui', coiffeur: 'non' },
  { cle: 'stats.perso', admin: 'oui', gerant: 'oui', coiffeur: 'limite' },
  { cle: 'admin360', admin: 'oui', gerant: 'non', coiffeur: 'non' },
  { cle: 'journal', admin: 'oui', gerant: 'non', coiffeur: 'non' },
  { cle: 'params', admin: 'oui', gerant: 'limite', coiffeur: 'non' },
  { cle: 'users', admin: 'oui', gerant: 'non', coiffeur: 'non' },
  { cle: 'export', admin: 'oui', gerant: 'limite', coiffeur: 'non' },
];

const ROLES: Role[] = ['admin', 'gerant', 'coiffeur'];

async function main() {
  const salon = await prisma.salon.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nom: 'Maison Fade',
      tagline: 'Salon · Barber — Dakar',
      tel: '+221 77 000 00 00',
      adresse: 'Dakar, Sénégal',
      fauteuils: 2,
      devise: 'XOF',
      fuseau: 'Africa/Dakar',
    },
    update: {},
  });

  for (const entry of PERMISSION_MATRIX) {
    for (const role of ROLES) {
      await prisma.rolePermission.upsert({
        where: { role_clePermission: { role, clePermission: entry.cle } },
        create: {
          role,
          clePermission: entry.cle,
          valeur: entry[role],
          plafond: entry.plafond?.[role] ?? null,
        },
        update: {
          valeur: entry[role],
          plafond: entry.plafond?.[role] ?? null,
        },
      });
    }
  }

  const demoUsers = [
    { login: 'bamba', nom: 'Bamba', role: Role.admin, pin: '1234', password: 'MaisonFade2026!' },
    { login: 'fallou', nom: 'Fallou', role: Role.gerant, pin: '2345', password: 'MaisonFade2026!' },
    { login: 'palaye', nom: 'Pa Laye', role: Role.coiffeur, pin: '3456', password: 'MaisonFade2026!' },
    { login: 'jaz', nom: 'Jaz', role: Role.coiffeur, pin: '4567', password: 'MaisonFade2026!' },
  ];

  for (const demo of demoUsers) {
    const pinHash = await argon2.hash(demo.pin, { type: argon2.argon2id });
    const passwordHash = await argon2.hash(demo.password, {
      type: argon2.argon2id,
    });

    const user = await prisma.user.upsert({
      where: { login: demo.login },
      create: {
        salonId: salon.id,
        login: demo.login,
        nom: demo.nom,
        role: demo.role,
        pinHash,
        passwordHash,
      },
      update: { pinHash, passwordHash, nom: demo.nom, role: demo.role },
    });

    if (demo.role === Role.coiffeur) {
      await prisma.staffProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          tauxCommission: 15,
          dateEntree: new Date(),
        },
        update: {},
      });
    }

    // Appareil pré-approuvé pour les tests locaux (évite le flux d'enrôlement en dev).
    await prisma.device.upsert({
      where: { empreinte: `seed-device-${demo.login}` },
      create: {
        userId: user.id,
        empreinte: `seed-device-${demo.login}`,
        libelle: `Appareil de démo — ${demo.nom}`,
        approuve: true,
      },
      update: { approuve: true },
    });
  }

  await prisma.setting.upsert({
    where: { cle: 'salon.identite' },
    create: {
      cle: 'salon.identite',
      valeur: { nom: 'Maison Fade', devise: 'XOF' },
      salonId: salon.id,
    },
    update: {},
  });

  console.log('Seed terminé : salon "Maison Fade", 4 comptes, permissions et appareils de démo créés.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
