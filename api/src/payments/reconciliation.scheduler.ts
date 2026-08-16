import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

// CDC §5.4 : "un travail de fond interroge toutes les 30 secondes le statut
// des intentions en attente de plus de 2 minutes".
@Injectable()
export class ReconciliationScheduler {
  private readonly logger = new Logger(ReconciliationScheduler.name);

  constructor(private readonly payments: PaymentsService) {}

  @Interval(30_000)
  async run() {
    const { checked } = await this.payments.reconcilePending();
    if (checked > 0) {
      this.logger.log(`Réconciliation : ${checked} paiement(s) en attente vérifié(s)`);
    }
  }
}
