import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Réponses d'erreur normalisées {code, message, details} — CDC §7.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Les erreurs inattendues (hors HttpException) ne doivent jamais fuiter
    // leur message brut au client (traces internes, erreurs Prisma/DB...) —
    // elles sont journalisées côté serveur pour investigation.
    if (!isHttp) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body = isHttp ? exception.getResponse() : null;
    const message = isHttp
      ? typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] })?.message ??
          'Erreur interne')
      : 'Erreur interne';

    const details =
      typeof body === 'object' && body !== null && 'details' in body
        ? (body as { details?: unknown }).details
        : typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: unknown }).message
          : undefined;

    response.status(status).json({
      code: HttpStatus[status] ?? 'INTERNAL_ERROR',
      message: Array.isArray(message) ? message.join(', ') : message,
      details: Array.isArray(message) ? message : details,
    });
  }
}
