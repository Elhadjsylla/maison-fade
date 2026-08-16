import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async listProfiles(salonId: string) {
    const coiffeurs = await this.prisma.user.findMany({
      where: { salonId, role: 'coiffeur', actif: true },
      select: { id: true, nom: true, login: true, role: true },
      orderBy: { nom: 'asc' },
    });
    const profiles = await this.prisma.staffProfile.findMany({
      where: { userId: { in: coiffeurs.map((c) => c.id) } },
    });
    const byUser = new Map(profiles.map((p) => [p.userId, p]));

    return coiffeurs.map((c) => ({
      user: c,
      profile: byUser.get(c.id) ?? {
        userId: c.id,
        specialite: null,
        objectifMensuel: null,
        tauxCommission: 15,
        dateEntree: null,
        noteMoyenne: null,
      },
    }));
  }

  async updateProfile(userId: string, dto: UpdateStaffProfileDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, role: 'coiffeur' } });
    if (!user) throw new NotFoundException('Coiffeur introuvable');

    return this.prisma.staffProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }
}
