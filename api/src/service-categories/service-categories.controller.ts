import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('service-categories')
@UseGuards(JwtAuthGuard)
export class ServiceCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.serviceCategory.findMany({ orderBy: { ordre: 'asc' } });
  }
}
