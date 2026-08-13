import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.device.findMany({
      include: { user: { select: { id: true, nom: true, login: true } } },
      orderBy: { creeLe: 'desc' },
    });
  }

  async approve(deviceId: string, approuveParId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
    if (!device) throw new NotFoundException('Appareil introuvable');

    return this.prisma.device.update({
      where: { id: deviceId },
      data: { approuve: true, approuveParId },
    });
  }
}
