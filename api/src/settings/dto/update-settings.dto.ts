import { IsObject } from 'class-validator';

// Paramètres du salon (CDC §4.10) — paire clé/valeur JSON, upsert par clé.
export class UpdateSettingsDto {
  @IsObject()
  settings!: Record<string, unknown>;
}
