import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddTicketItemDto } from './add-ticket-item.dto';

// Coiffeur obligatoire, client facultatif (CDC §2.3 — aucun encaissement anonyme
// de coiffeur, mais le client déclenche la fidélité seulement s'il est renseigné).
export class CreateTicketDto {
  @IsString()
  coiffeurId!: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  // Articles créés avec le ticket en un seul appel — évite un aller-retour
  // réseau par article (perçu comme un délai à l'encaissement côté caisse).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddTicketItemDto)
  items?: AddTicketItemDto[];
}
