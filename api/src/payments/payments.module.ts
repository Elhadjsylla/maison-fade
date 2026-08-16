import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UnitechPayProvider } from './providers/unitech-pay.provider';
import { ReconciliationScheduler } from './reconciliation.scheduler';
import { AuditModule } from '../audit/audit.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuditModule, AlertsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, UnitechPayProvider, ReconciliationScheduler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
