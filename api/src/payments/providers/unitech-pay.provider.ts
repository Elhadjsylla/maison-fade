import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type {
  PaymentEventType,
  PaymentIntent,
  PaymentProvider,
  VerifiedWebhookEvent,
} from './payment-provider.interface';

interface UnitechPaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    transaction_id: number | string;
    reference: string;
    payment_url: string;
    amount: number;
    status: string;
  };
}

interface UnitechWebhookPayload {
  event: PaymentEventType;
  transaction_id: number | string;
  reference: string;
  amount: number;
  status: string;
  method: string;
  commission?: number;
  net_amount?: number;
  timestamp: number;
}

// Intègre exclusivement Wave et Max It via UnitechPay (pas de Free Money —
// non couvert par ce prestataire). Aucun mode sandbox documenté : chaque
// appel touche l'API de production.
@Injectable()
export class UnitechPayProvider implements PaymentProvider {
  readonly name = 'unitechpay';

  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get('UNITECHPAY_BASE_URL') ?? 'https://api.unitech.sn/api';
    this.apiKey = this.config.get('UNITECHPAY_API_KEY') ?? '';
  }

  async createIntent(params: {
    montant: number;
    ticketRef: string;
    methode: 'wave' | 'orange_money';
    customerPhone?: string;
  }): Promise<PaymentIntent> {
    if (!this.apiKey) {
      throw new BadRequestException('UNITECHPAY_API_KEY non configurée');
    }
    if (!params.customerPhone) {
      throw new BadRequestException(
        'Le numéro de téléphone du client est requis pour ce moyen de paiement',
      );
    }

    const action = params.methode === 'wave' ? 'create_wave_payment' : 'create_orange_maxit';
    const url = `${this.baseUrl}?action=${action}`;

    const body: Record<string, unknown> = {
      amount: params.montant,
      customer_number: params.customerPhone,
      description: `Ticket ${params.ticketRef}`,
    };
    const callbackSuccess = this.config.get('UNITECHPAY_CALLBACK_SUCCESS');
    const callbackCancel = this.config.get('UNITECHPAY_CALLBACK_CANCEL');
    if (callbackSuccess) body.callback_success = callbackSuccess;
    if (callbackCancel) body.callback_cancel = callbackCancel;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as UnitechPaymentResponse;

    if (!res.ok || !json.success || !json.data) {
      throw new BadRequestException(
        `UnitechPay a refusé la création du paiement : ${json.message ?? res.statusText}`,
      );
    }

    return {
      providerRef: json.data.reference,
      launchUrl: json.data.payment_url,
      status: 'pending',
    };
  }

  async getStatus(providerRef: string): Promise<'pending' | 'succeeded' | 'failed' | 'expired'> {
    const url = `${this.baseUrl}?action=transactions`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const json = (await res.json()) as Record<string, unknown>;

    // Forme exacte de la liste non garantie par la doc — on tolère plusieurs
    // emplacements plutôt que de faire planter la réconciliation périodique
    // (simple filet de secours, la confirmation réelle passe par le webhook).
    const list: unknown =
      (Array.isArray(json.data) && json.data) ||
      (Array.isArray((json.data as Record<string, unknown>)?.transactions) &&
        (json.data as Record<string, unknown>).transactions) ||
      (Array.isArray(json.transactions) && json.transactions) ||
      (Array.isArray(json) && json) ||
      [];

    const match = (list as { reference: string; status: string }[]).find(
      (t) => t.reference === providerRef,
    );
    if (!match) return 'pending';

    switch (match.status) {
      case 'completed':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'expired':
        return 'expired';
      default:
        return 'pending';
    }
  }

  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): VerifiedWebhookEvent {
    const signature = headers['x-unitechpay-signature'];
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Signature UnitechPay absente');
    }

    const expected = createHmac('sha256', this.apiKey).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    const valid =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!valid) {
      throw new BadRequestException('Signature UnitechPay invalide');
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as UnitechWebhookPayload;

    return {
      eventIdProvider: String(payload.transaction_id),
      type: payload.event,
      providerRef: payload.reference,
      montant: payload.amount,
      frais: payload.commission ?? 0,
      raw: payload,
    };
  }
}
