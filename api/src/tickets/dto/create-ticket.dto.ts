import { IsOptional, IsString } from 'class-validator';

// Coiffeur obligatoire, client facultatif (CDC §2.3 — aucun encaissement anonyme
// de coiffeur, mais le client déclenche la fidélité seulement s'il est renseigné).
export class CreateTicketDto {
  @IsString()
  coiffeurId!: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
