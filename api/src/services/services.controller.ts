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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @Permissions('services.lire')
  findAll(@Query('category') categorieId?: string) {
    return this.services.findAll(categorieId);
  }

  @Get(':id')
  @Permissions('services.lire')
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  @Post()
  @Permissions('services.ecrire')
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Patch(':id')
  @Permissions('services.ecrire')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete(':id')
  @Permissions('services.ecrire')
  archive(@Param('id') id: string) {
    return this.services.archive(id);
  }
}
