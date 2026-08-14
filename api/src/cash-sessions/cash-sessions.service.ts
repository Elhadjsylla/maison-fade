import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Injectable()
export class CashSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(salonId: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: { salonId, fermeLe: null },
      orderBy: { ouvertLe: 'desc' },
    });
    if (!session) throw new NotFoundException('Aucune session de caisse ouverte');
    return session;
  }

  async open(salonId: string, userId: string, dto: OpenCashSessionDto) {
    const existing = await this.prisma.cashSession.findFirst({
      where: { salonId, fermeLe: null },
    });
    if (existing) {
      throw new ConflictException('Une session de caisse est déjà ouverte');
    }

    return this.prisma.cashSession.create({
      data: {
        salonId,
        ouvertParId: userId,
        fondCaisse: dto.fondCaisse,
      },
    });
  }

  // Clôture Z (CDC §4.4) : écart calculé sur les tickets payés en espèces de
  // la session (fond de caisse + encaissements espèces attendus), motif
  // obligatoire si le comptage diverge.
  async close(id: string, userId: string, dto: CloseCashSessionDto) {
    const session = await this.prisma.cashSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session de caisse introuvable');
    if (session.fermeLe) {
      throw new ConflictException('Cette session est déjà clôturée');
    }

    const especes = await this.prisma.payment.aggregate({
      where: {
        methode: 'especes',
        statut: 'succeeded',
        ticket: { sessionId: id },
      },
      _sum: { montant: true },
    });

    const totalAttendu = session.fondCaisse + (especes._sum.montant ?? 0);
    const ecart = dto.totalCompte - totalAttendu;

    if (ecart !== 0 && !dto.motifEcart) {
      throw new BadRequestException(
        `Écart de ${ecart} F détecté — un motif est obligatoire`,
      );
    }

    return this.prisma.cashSession.update({
      where: { id },
      data: {
        fermeParId: userId,
        fermeLe: new Date(),
        totalAttendu,
        totalCompte: dto.totalCompte,
        ecart,
        motifEcart: dto.motifEcart,
      },
    });
  }
}
