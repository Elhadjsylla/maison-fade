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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @Permissions('rdv.lire')
  findAll(
    @Query('date') date?: string,
    @Query('coiffeur') coiffeurId?: string,
  ) {
    return this.appointments.findAll(date, coiffeurId);
  }

  @Post()
  @Permissions('rdv.ecrire')
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointments.create(dto);
  }

  @Patch(':id')
  @Permissions('rdv.ecrire')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointments.update(id, dto);
  }
}
