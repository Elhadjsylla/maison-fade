import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaymentsService } from './payments.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Aucun JwtAuthGuard : UnitechPay s'authentifie par signature HMAC sur le
  // corps brut, pas par notre JWT (CDC §5.4 — vérification obligatoire avant
  // toute écriture).
  @Post('webhooks/unitechpay')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    return this.payments.handleWebhook(req.rawBody!, req.headers);
  }

  @Get('payments/pending')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('caisse.session')
  listPending() {
    return this.payments.listPending();
  }

  @Post('payments/:id/refund')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('caisse.annuler')
  refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.payments.refund(id, dto.motif);
  }
}
