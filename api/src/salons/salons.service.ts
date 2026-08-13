import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(salonId: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });
    if (!salon) throw new NotFoundException('Salon introuvable');
    return salon;
  }

  update(salonId: string, dto: UpdateSalonDto) {
    return this.prisma.salon.update({
      where: { id: salonId },
      data: dto,
    });
  }
}
