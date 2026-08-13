import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

// Enrôlement d'appareil : premier accès validé par Bamba (CDC §4.1).
@Controller('devices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @Permissions('users')
  list() {
    return this.devices.list();
  }

  @Patch(':id/approve')
  @Permissions('users')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devices.approve(id, user.id);
  }
}
