import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @Permissions('clients.lire')
  search(@Query('q') q?: string) {
    return this.clients.search(q);
  }

  @Get(':id')
  @Permissions('clients.lire')
  findOne(@Param('id') id: string) {
    return this.clients.findOne(id);
  }

  @Get(':id/loyalty')
  @Permissions('clients.lire')
  getLoyalty(@Param('id') id: string) {
    return this.clients.getLoyalty(id);
  }

  @Post()
  @Permissions('clients.ecrire')
  create(@Body() dto: CreateClientDto) {
    return this.clients.create(dto);
  }

  @Patch(':id')
  @Permissions('clients.ecrire')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(id, dto);
  }

  // Droit d'accès (CDC §10) — export complet des données personnelles.
  @Get(':id/export')
  @Permissions('clients.lire')
  exportData(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clients.exportData(id, user);
  }

  // Droit de suppression (CDC §10) — anonymisation, réservée à l'admin.
  @Delete(':id')
  @Permissions('clients.ecrire')
  erase(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clients.erase(id, user);
  }
}
