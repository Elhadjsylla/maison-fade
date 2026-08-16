import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { ReceiptService } from './receipt.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketItemDto } from './dto/add-ticket-item.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { PayTicketDto } from './dto/pay-ticket.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  constructor(
    private readonly tickets: TicketsService,
    private readonly receipts: ReceiptService,
  ) {}

  @Get(':id')
  @Permissions('caisse.encaisser')
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  // Reçu PDF conforme (CDC §7/§10) — mentions légales, format 80 mm.
  @Get(':id/receipt.pdf')
  @Permissions('caisse.encaisser')
  async receipt(@Param('id') id: string, @Res() res: Response) {
    const { filename, stream } = await this.receipts.build(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    stream.pipe(res);
  }

  @Post()
  @Permissions('caisse.encaisser')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.tickets.create(user.salonId, user.id, dto);
  }

  @Post(':id/items')
  @Permissions('caisse.encaisser')
  addItem(@Param('id') id: string, @Body() dto: AddTicketItemDto) {
    return this.tickets.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Permissions('caisse.encaisser')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.tickets.removeItem(id, itemId);
  }

  @Post(':id/discount')
  @Permissions('caisse.remise')
  applyDiscount(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyDiscountDto,
  ) {
    return this.tickets.applyDiscount(id, dto, user);
  }

  @Post(':id/pay')
  @Permissions('caisse.encaisser')
  pay(@Param('id') id: string, @Body() dto: PayTicketDto) {
    return this.tickets.pay(id, dto);
  }

  @Post(':id/cancel')
  @Permissions('caisse.annuler')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelTicketDto,
  ) {
    return this.tickets.cancel(id, user, dto);
  }
}
