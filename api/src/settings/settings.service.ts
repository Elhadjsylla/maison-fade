import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(salonId: string) {
    const rows = await this.prisma.setting.findMany({ where: { salonId } });
    return Object.fromEntries(rows.map((row) => [row.cle, row.valeur]));
  }

  async update(
    salonId: string,
    modifieParId: string,
    settings: Record<string, unknown>,
  ) {
    await this.prisma.$transaction(
      Object.entries(settings).map(([cle, valeur]) =>
        this.prisma.setting.upsert({
          where: { cle },
          create: { cle, valeur: valeur as object, salonId, modifieParId },
          update: { valeur: valeur as object, modifieParId },
        }),
      ),
    );

    return this.findAll(salonId);
  }
}
