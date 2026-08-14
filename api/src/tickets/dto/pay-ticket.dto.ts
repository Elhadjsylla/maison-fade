import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

const METHODES = ['especes', 'wave', 'orange_money', 'free_money', 'carte'] as const;
export type MethodePaiement = (typeof METHODES)[number];

// Paiement mixte non géré ici (V1 simplifiée) : un seul moyen par appel.
// "especes" est traité immédiatement (encaissement interne, CDC §5.1) ; les
// autres moyens créent une intention en attente — leur suivi réel (webhooks,
// confirmation) est le lot L4 Paiements Sénégal.
export class PayTicketDto {
  @IsIn(METHODES)
  methode!: MethodePaiement;

  @IsInt()
  @Min(0)
  montant!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recu?: number;
}
