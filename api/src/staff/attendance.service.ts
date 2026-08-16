import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PunchAttendanceDto } from './dto/punch-attendance.dto';

type Pause = { debut: string; fin?: string };

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Pointage arrivée/pause/départ (CDC §4.6) — un geste depuis l'espace
// coiffeur. Le retard est calculé contre l'horaire du salon du jour
// (paramètre `horaires`, Africa/Dakar = UTC toute l'année, pas de DST).
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private todayDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  async punch(userId: string, salonId: string, action: PunchAttendanceDto['action']) {
    const date = this.todayDate();
    const now = new Date();
    let row = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (action === 'arrivee') {
      if (row?.heureArrivee) {
        throw new ConflictException('Arrivée déjà pointée aujourd\'hui');
      }
      const retardMin = await this.computeRetard(salonId, now);
      return this.prisma.attendance.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, heureArrivee: now, retardMin },
        update: { heureArrivee: now, retardMin },
      });
    }

    if (!row?.heureArrivee) {
      throw new BadRequestException('Pointez d\'abord votre arrivée');
    }
    if (row.heureDepart) {
      throw new ConflictException('Départ déjà pointé aujourd\'hui');
    }

    const pauses = ((row.pauses as Pause[] | null) ?? []).slice();
    const enPause = pauses.length > 0 && !pauses[pauses.length - 1].fin;

    if (action === 'pause') {
      if (enPause) throw new ConflictException('Déjà en pause');
      pauses.push({ debut: now.toISOString() });
      return this.prisma.attendance.update({ where: { id: row.id }, data: { pauses } });
    }

    if (action === 'reprise') {
      if (!enPause) throw new BadRequestException('Aucune pause en cours');
      pauses[pauses.length - 1] = { ...pauses[pauses.length - 1], fin: now.toISOString() };
      return this.prisma.attendance.update({ where: { id: row.id }, data: { pauses } });
    }

    // depart
    if (enPause) {
      throw new BadRequestException('Reprenez le service avant de pointer le départ');
    }
    return this.prisma.attendance.update({
      where: { id: row.id },
      data: { heureDepart: now },
    });
  }

  private async computeRetard(salonId: string, now: Date): Promise<number> {
    const setting = await this.prisma.setting.findUnique({ where: { cle: 'horaires' } });
    if (!setting || setting.salonId !== salonId) return 0;

    const jour = JOURS[now.getUTCDay()];
    const horaires = setting.valeur as Record<string, [string, string, number]> | null;
    const horaire = horaires?.[jour];
    if (!horaire || !horaire[2]) return 0;

    const [startH, startM] = horaire[0].split(':').map(Number);
    if (Number.isNaN(startH) || Number.isNaN(startM)) return 0;

    const debutMinutes = startH * 60 + startM;
    const arriveeMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    return Math.max(0, arriveeMinutes - debutMinutes);
  }

  today(userId: string) {
    return this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: this.todayDate() } },
    });
  }

  async monthSummary(userId: string, month?: string) {
    const [y, m] = (month ?? new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));

    const jours = await this.prisma.attendance.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
    });

    const heuresTotal = jours.reduce((sum, r) => sum + this.hoursWorked(r), 0);
    const retardsTotal = jours.reduce((sum, r) => sum + r.retardMin, 0);

    return {
      jours,
      heuresTotal: Math.round(heuresTotal * 10) / 10,
      retardsTotal,
    };
  }

  private hoursWorked(row: {
    heureArrivee: Date | null;
    heureDepart: Date | null;
    pauses: unknown;
  }): number {
    if (!row.heureArrivee || !row.heureDepart) return 0;
    const pauseMs = ((row.pauses as Pause[] | null) ?? []).reduce((sum, p) => {
      if (!p.fin) return sum;
      return sum + (new Date(p.fin).getTime() - new Date(p.debut).getTime());
    }, 0);
    const totalMs = row.heureDepart.getTime() - row.heureArrivee.getTime() - pauseMs;
    return Math.max(0, totalMs / 3_600_000);
  }

  // Récap mensuel équipe (heures, retards) pour l'écran Personnel du
  // gérant/admin — même calcul que monthSummary() côté « Mon pointage »,
  // appliqué à toute l'équipe en une seule lecture.
  async teamMonth(salonId: string, month?: string) {
    const [y, m] = (month ?? new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));

    const equipe = await this.prisma.user.findMany({
      where: { salonId, role: { in: ['coiffeur', 'gerant'] }, actif: true },
      select: { id: true, nom: true, role: true },
      orderBy: { nom: 'asc' },
    });
    const jours = await this.prisma.attendance.findMany({
      where: { date: { gte: start, lt: end }, userId: { in: equipe.map((u) => u.id) } },
    });
    const byUser = new Map<string, typeof jours>();
    for (const j of jours) {
      const arr = byUser.get(j.userId) ?? [];
      arr.push(j);
      byUser.set(j.userId, arr);
    }

    return equipe.map((u) => {
      const rows = byUser.get(u.id) ?? [];
      const heuresTotal = rows.reduce((sum, r) => sum + this.hoursWorked(r), 0);
      const retardsTotal = rows.reduce((sum, r) => sum + r.retardMin, 0);
      return {
        user: u,
        heuresTotal: Math.round(heuresTotal * 10) / 10,
        retardsTotal,
        joursTravailles: rows.filter((r) => r.heureArrivee).length,
      };
    });
  }

  async teamToday(salonId: string) {
    const equipe = await this.prisma.user.findMany({
      where: { salonId, role: { in: ['coiffeur', 'gerant'] }, actif: true },
      select: { id: true, nom: true, role: true },
      orderBy: { nom: 'asc' },
    });
    const rows = await this.prisma.attendance.findMany({
      where: { date: this.todayDate(), userId: { in: equipe.map((u) => u.id) } },
    });
    const byUser = new Map(rows.map((r) => [r.userId, r]));
    return equipe.map((u) => ({ user: u, attendance: byUser.get(u.id) ?? null }));
  }
}
