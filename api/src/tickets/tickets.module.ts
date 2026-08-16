import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { ReceiptService } from './receipt.service';
import { PaymentsModule } from '../payments/payments.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PaymentsModule, AuditModule],
  controllers: [TicketsController],
  providers: [TicketsService, ReceiptService],
})
export class TicketsModule {}
