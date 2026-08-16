import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Alerte Telegram à Bamba (CDC §8 Observabilité — « détection avant
// réclamation client »). Choisi plutôt que WhatsApp : gratuit, pas de
// compte Business Meta à faire valider. Silencieux si non configuré
// (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID absents des variables d'env) — ne
// doit jamais faire échouer le flux métier qui déclenche l'alerte.
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token?: string;
  private readonly chatId?: string;

  constructor(config: ConfigService) {
    this.token = config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = config.get<string>('TELEGRAM_CHAT_ID');
  }

  get configured(): boolean {
    return !!this.token && !!this.chatId;
  }

  async notify(message: string): Promise<void> {
    if (!this.configured) return;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: this.chatId, text: message, parse_mode: 'HTML' }),
      });
      if (!res.ok) {
        this.logger.warn(`Alerte Telegram refusée (${res.status}): ${await res.text()}`);
      }
    } catch (err) {
      this.logger.warn(`Alerte Telegram injoignable: ${(err as Error).message}`);
    }
  }
}
