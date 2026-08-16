// Abstraction PaymentProvider (CDC §5.2) — le reste de l'app ne connaît que
// cette interface, jamais les détails d'un prestataire précis. Permet de
// basculer/ajouter un prestataire (Free Money, carte...) sans toucher au
// module tickets/paiements.
export type MethodePaiementExterne = 'wave' | 'orange_money';

export interface PaymentIntent {
  providerRef: string;
  launchUrl?: string;
  qr?: string;
  status: 'pending' | 'failed';
}

export type PaymentEventType = 'payment_completed' | 'payment_failed' | 'payment_expired';

export interface VerifiedWebhookEvent {
  eventIdProvider: string;
  type: PaymentEventType;
  providerRef: string;
  montant: number;
  frais: number;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  createIntent(params: {
    montant: number;
    ticketRef: string;
    methode: MethodePaiementExterne;
    customerPhone?: string;
  }): Promise<PaymentIntent>;

  getStatus(providerRef: string): Promise<'pending' | 'succeeded' | 'failed' | 'expired'>;

  // Vérifie la signature sur le corps BRUT reçu (jamais le JSON reparsé —
  // CDC §5.4) et renvoie l'événement normalisé, ou lève si invalide.
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): VerifiedWebhookEvent;
}
