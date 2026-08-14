import {
  Body,
  Controller,
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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

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
}
