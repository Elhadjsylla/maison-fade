import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const OPEN_STATUTS = [
  'a_venir',
  'attente_sur_place',
  'en_cours',
] as const;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(date?: string, coiffeurId?: string) {
    const range = date ? dayRange(date) : undefined;
    return this.prisma.appointment.findMany({
      where: {
        ...(coiffeurId ? { coiffeurId } : {}),
        ...(range ? { debut: { gte: range.start, lt: range.end } } : {}),
      },
      include: {
        client: true,
        service: true,
        // Jamais les hash PIN/mot de passe dans une réponse API.
        coiffeur: { select: { id: true, nom: true, login: true, role: true } },
      },
      orderBy: { debut: 'asc' },
    });
  }

  async create(dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, archivedAt: null },
    });
    if (!service) throw new NotFoundException('Prestation introuvable');

    const coiffeur = await this.assertCoiffeur(dto.coiffeurId);

    const debut = new Date(dto.debut);
    const fin = new Date(debut.getTime() + service.dureeMin * 60_000);

    await this.assertNoOverlap(coiffeur.id, debut, fin);

    return this.prisma.appointment.create({
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        coiffeurId: dto.coiffeurId,
        debut,
        fin,
        note: dto.note,
        source: dto.source ?? 'salon',
      },
      include: {
        client: true,
        service: true,
        // Jamais les hash PIN/mot de passe dans une réponse API.
        coiffeur: { select: { id: true, nom: true, login: true, role: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    const coiffeurId = dto.coiffeurId ?? appointment.coiffeurId;
    if (dto.coiffeurId) await this.assertCoiffeur(dto.coiffeurId);

    const debut = dto.debut ? new Date(dto.debut) : appointment.debut;
    const fin = dto.debut
      ? new Date(debut.getTime() + appointment.service.dureeMin * 60_000)
      : appointment.fin;

    if (dto.debut || dto.coiffeurId) {
      await this.assertNoOverlap(coiffeurId, debut, fin, id);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        coiffeurId: dto.coiffeurId,
        debut: dto.debut ? debut : undefined,
        fin: dto.debut ? fin : undefined,
        statut: dto.statut,
        note: dto.note,
      },
      include: {
        client: true,
        service: true,
        // Jamais les hash PIN/mot de passe dans une réponse API.
        coiffeur: { select: { id: true, nom: true, login: true, role: true } },
      },
    });
  }

  private async assertCoiffeur(coiffeurId: string) {
    const coiffeur = await this.prisma.user.findFirst({
      where: { id: coiffeurId, role: 'coiffeur', actif: true },
    });
    if (!coiffeur) {
      throw new BadRequestException(
        'Le rendez-vous doit être rattaché à un coiffeur actif',
      );
    }
    return coiffeur;
  }

  private async assertNoOverlap(
    coiffeurId: string,
    debut: Date,
    fin: Date,
    excludeId?: string,
  ) {
    const clash = await this.prisma.appointment.findFirst({
      where: {
        coiffeurId,
        id: excludeId ? { not: excludeId } : undefined,
        statut: { in: [...OPEN_STATUTS] },
        debut: { lt: fin },
        fin: { gt: debut },
      },
    });
    if (clash) {
      throw new ConflictException(
        'Ce créneau chevauche un autre rendez-vous de ce coiffeur',
      );
    }
  }
}

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { start, end };
}
