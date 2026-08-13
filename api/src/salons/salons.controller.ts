import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SalonsService } from './salons.service';
import { UpdateSalonDto } from './dto/update-salon.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('salons/me')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalonsController {
  constructor(private readonly salons: SalonsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.salons.findOne(user.salonId);
  }

  @Patch()
  @Permissions('params')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSalonDto,
  ) {
    return this.salons.update(user.salonId, dto);
  }
}
