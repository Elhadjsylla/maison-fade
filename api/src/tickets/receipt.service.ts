import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

// Logo co-localise dans le projet API (pas un chemin frontend, inatteignable
// depuis ce processus) - absent en silence si jamais retire, un recu sans
// logo reste un recu valide.
const LOGO_PATH = join(process.cwd(), 'assets', 'logo.jpeg');
const LOGO_RATIO = 936 / 1280; // dimensions natives assets/logo.jpeg (1280x936)

// Palette reprise du logo (or mat sur fond ivoire) et du plum de marque de
// l'app - meme identite visuelle que le SaaS, jusque sur le recu imprime.
const PALETTE = {
  paper: '#F7F0E6',
  ink: '#2E1A2F', // = --plum de l'app
  gold: '#9C7A34',
  goldDeep: '#7C5F27',
  goldSoft: '#EFE1C4',
  muted: '#7C6F7E',
  line: '#DFCFA9',
  success: '#1F7E52',
};

// Remplace l'espace insecable fin (U+202F, produit par toLocaleString('fr-FR'))
// par un espace normal - Helvetica/WinAnsi n'a pas ce glyphe, qui devenait un
// caractere de substitution illisible.
const fmt = (n: number) => `${n.toLocaleString('fr-FR').replace(/[  ]/g, ' ')} F`;

// Recu PDF conforme (CDC S10) : raison sociale, NINEA, date, numero
// sequentiel, detail, total. Le NINEA/la raison sociale sont des
// informations propres au salon (Parametres) - tant qu'elles ne sont pas
// renseignees, le recu l'indique explicitement plutot que d'omettre en
// silence une mention legale obligatoire.
//
// Contrainte polices : PDFKit n'embarque que les 14 polices PDF standard
// (Helvetica/Times/Courier, encodage WinAnsi) - aucun glyphe hors Latin-1
// (symboles, coches, tirets typographiques) n'est fiable ici ; on s'en tient
// volontairement aux lettres, chiffres et accents francais deja valides.
@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async build(ticketId: string): Promise<{ filename: string; stream: PDFKit.PDFDocument }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        items: true,
        payments: { where: { statut: 'succeeded' } },
        client: true,
        coiffeur: { select: { nom: true } },
        session: { include: { salon: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const salon = ticket.session.salon;
    const doc = new PDFDocument({ size: [227, 620], margin: 0 }); // ~80 mm thermique
    const M = 16; // marge interieure geree a la main (margin:0 sur le doc,
    // pour pouvoir peindre le fond ivoire sur toute la page avant le cadre).
    const contentWidth = doc.page.width - M * 2;

    // Fond ivoire pleine page + fin cadre or - reprend le papier du logo,
    // donne au recu la meme carte "premium" que les modales de l'app.
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(PALETTE.paper);
    doc.rect(6, 6, doc.page.width - 12, doc.page.height - 12)
      .lineWidth(0.75).strokeColor(PALETTE.line).stroke();

    doc.x = M;
    doc.y = 20;

    if (existsSync(LOGO_PATH)) {
      const logoWidth = 118;
      const logoHeight = logoWidth * LOGO_RATIO;
      doc.image(LOGO_PATH, (doc.page.width - logoWidth) / 2, doc.y, { width: logoWidth });
      doc.y += logoHeight + 10;
    }

    // Identite du salon - sous-titre raffine plutot qu'un doublon du logo
    // (qui affiche deja "MAISON FADE" en grand) : petites capitales
    // espacees, dans le ton or du logo.
    this.centeredCaps(doc, salon.raisonSociale ?? salon.nom, PALETTE.goldDeep, 9.5);
    doc.moveDown(0.2);
    if (salon.tagline) this.centeredLine(doc, salon.tagline, 'Times-Italic', 8, PALETTE.muted);
    if (salon.adresse) this.centeredLine(doc, salon.adresse, 'Helvetica', 7.5, PALETTE.muted);
    if (salon.tel) this.centeredLine(doc, `Tel : ${salon.tel}`, 'Helvetica', 7.5, PALETTE.muted);
    this.centeredLine(doc, `NINEA : ${salon.ninea ?? 'a renseigner dans Parametres'}`, 'Helvetica', 7.5, PALETTE.muted);

    this.ornamentalRule(doc, M, contentWidth);

    // Numero de ticket - le repere visuel principal du recu, traite comme un
    // petit fronton (police serif, couleur or) plutot qu'une ligne parmi
    // d'autres.
    doc.font('Times-Bold').fontSize(13).fillColor(PALETTE.gold)
      .text(`TICKET #${String(ticket.numero).padStart(5, '0')}`, M, doc.y, { width: contentWidth, align: 'center' });
    const date = ticket.payeLe ?? ticket.creeLe;
    this.centeredLine(
      doc,
      `${date.toLocaleDateString('fr-FR')} a ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      'Helvetica', 7.5, PALETTE.muted,
    );
    doc.moveDown(0.4);

    this.labelValue(doc, M, 'Coiffeur', ticket.coiffeur.nom);
    if (ticket.client) this.labelValue(doc, M, 'Client', ticket.client.nom);

    this.rule(doc, M, contentWidth);

    for (const item of ticket.items) {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PALETTE.gold)
        .text(`${item.quantite}x`, M, y, { width: 20 });
      doc.font('Helvetica').fontSize(8.5).fillColor(PALETTE.ink)
        .text(item.libelle, M + 20, y, { width: contentWidth - 20 - 60 });
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PALETTE.ink)
        .text(fmt(item.total), M + contentWidth - 60, y, { width: 60, align: 'right' });
      doc.moveDown(0.35);
    }

    this.rule(doc, M, contentWidth);

    this.rowLine(doc, M, contentWidth, 'Sous-total', fmt(ticket.sousTotal), PALETTE.muted, PALETTE.ink, 8.5);
    if (ticket.remiseMontant > 0) {
      this.rowLine(
        doc, M, contentWidth,
        `Remise${ticket.remiseMotif ? ` (${ticket.remiseMotif})` : ''}`,
        `- ${fmt(ticket.remiseMontant)}`,
        PALETTE.gold, PALETTE.gold, 8.5,
      );
    }
    doc.moveDown(0.25);

    // Total - le nombre qui compte, mis en valeur dans un bandeau or clair
    // comme les totaux de l'ecran de caisse (grand chiffre serif sur fond
    // tinte). Positions calculees a partir d'un seul repere (boxTop) plutot
    // qu'un enchainement de doc.y relatifs, pour ne jamais chevaucher les
    // lignes qui precedent.
    const boxTop = doc.y;
    const boxH = 32;
    doc.rect(M - 2, boxTop, contentWidth + 4, boxH).fill(PALETTE.goldSoft);
    doc.font('Times-Bold').fontSize(10).fillColor(PALETTE.ink)
      .text('TOTAL PAYE', M + 8, boxTop + 11, { width: contentWidth * 0.45, lineBreak: false });
    doc.font('Times-Bold').fontSize(16).fillColor(PALETTE.goldDeep)
      .text(fmt(ticket.total), M, boxTop + 7, { width: contentWidth - 8, align: 'right', lineBreak: false });
    doc.y = boxTop + boxH + 6;

    const paiement = ticket.payments[0];
    if (paiement) {
      const pDate = (paiement.confirmeLe ?? date).toLocaleDateString('fr-FR');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.success)
        .text(`Paye par ${this.methodeLabel(paiement.methode)} le ${pDate}`, M, doc.y, { width: contentWidth, align: 'center' });
      doc.moveDown(0.3);
    }

    this.ornamentalRule(doc, M, contentWidth);

    doc.font('Helvetica').fontSize(6.5).fillColor(PALETTE.muted).text(
      'Recu conserve 10 ans conformement a la reglementation applicable.\nDocument genere electroniquement.',
      M, doc.y, { width: contentWidth, align: 'center', lineGap: 1.5 },
    );
    doc.moveDown(0.6);
    doc.font('Times-Italic').fontSize(8).fillColor(PALETTE.gold)
      .text('Fresh Look Every Time', M, doc.y, { width: contentWidth, align: 'center' });

    doc.end();

    return {
      filename: `ticket-${String(ticket.numero).padStart(5, '0')}.pdf`,
      stream: doc,
    };
  }

  private methodeLabel(methode: string): string {
    return { especes: 'especes', wave: 'Wave', orange_money: 'Orange Money' }[methode] ?? methode;
  }

  private centeredCaps(doc: PDFKit.PDFDocument, text: string, color: string, size: number) {
    const m = doc.page.margins.left || 16;
    // characterSpacing (operateur PDF natif Tc) plutot qu'un espacement
    // manuel entre lettres, qui a deja provoque un retour a la ligne apres
    // chaque caractere lors d'un essai precedent.
    doc.font('Times-Bold').fontSize(size).fillColor(color)
      .text(text.toUpperCase(), m, doc.y, {
        width: doc.page.width - m * 2, align: 'center', characterSpacing: 1.4, lineBreak: false,
      });
  }

  private centeredLine(doc: PDFKit.PDFDocument, text: string, font: string, size: number, color: string) {
    const m = doc.page.margins.left || 16;
    doc.font(font).fontSize(size).fillColor(color)
      .text(text, m, doc.y, { width: doc.page.width - m * 2, align: 'center' });
  }

  private labelValue(doc: PDFKit.PDFDocument, x: number, label: string, value: string) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(8).fillColor(PALETTE.muted).text(`${label} `, x, y, { continued: true });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.ink).text(value);
  }

  private rowLine(
    doc: PDFKit.PDFDocument, x: number, width: number,
    label: string, value: string, labelColor: string, valueColor: string, size: number,
  ) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(size).fillColor(labelColor).text(label, x, y, { width: width - 70 });
    doc.font('Helvetica-Bold').fontSize(size).fillColor(valueColor).text(value, x + width - 70, y, { width: 70, align: 'right' });
    doc.moveDown(0.3);
  }

  private rule(doc: PDFKit.PDFDocument, x: number, width: number) {
    doc.moveDown(0.3);
    doc.moveTo(x, doc.y).lineTo(x + width, doc.y).lineWidth(0.6).strokeColor(PALETTE.line).stroke();
    doc.moveDown(0.3);
  }

  // Separateur decoratif : deux segments de trait avec un point plein au
  // centre, dessine (pas un glyphe de police) pour rester fiable quel que
  // soit l'encodage - echo discret du filet sous "FADE" sur le logo.
  private ornamentalRule(doc: PDFKit.PDFDocument, x: number, width: number) {
    doc.moveDown(0.35);
    const y = doc.y + 3;
    const midX = x + width / 2;
    doc.moveTo(x, y).lineTo(midX - 10, y).lineWidth(0.6).strokeColor(PALETTE.line).stroke();
    doc.moveTo(midX + 10, y).lineTo(x + width, y).lineWidth(0.6).strokeColor(PALETTE.line).stroke();
    doc.circle(midX, y, 1.8).fill(PALETTE.gold);
    doc.y = y + 8;
  }
}
