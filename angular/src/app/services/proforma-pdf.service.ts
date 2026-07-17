import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenServicio } from '../services/orden-servicio.service';

@Injectable({ providedIn: 'root' })
export class ProformaPdfService {

  private readonly PAGE_W = 210;
  private readonly PAGE_H = 297;
  private readonly MARGIN = 12;
  private readonly BLUE = [26, 60, 94] as const;
  private readonly GRAY = [100, 100, 100] as const;
  private readonly LIGHT_GRAY = [220, 220, 220] as const;
  private readonly WHITE = [255, 255, 255] as const;

  generarProforma(orden: OrdenServicio, cliente: any, vehiculo: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = this.PAGE_W;
    const M = this.MARGIN;
    const usable = W - M * 2;
    let y = M;

    // ─── ENCABEZADO ───
    doc.setFillColor(...this.BLUE);
    doc.rect(0, 0, W, 28, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.WHITE);
    doc.text('SERVICIO AUTOMOTRIZ', W / 2, 12, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Taller Mecánico Especializado', W / 2, 18, { align: 'center' });
    doc.text('RUC: 0999999999001 | Tel: (04) 2XXX-XXX | Email: info@mecanicapp.com', W / 2, 23, { align: 'center' });
    y = 34;

    // ─── TÍTULO PROFORMA ───
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('PROFORMA', W / 2, y, { align: 'center' });
    y += 8;

    // N° PRE
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.GRAY);
    doc.text(`N° PRE-${orden.codigo || '______'}`, W - M, y, { align: 'right' });
    y += 6;

    // ─── LÍNEA SEPARADORA ───
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 6;

    // ─── DATOS DEL CLIENTE Y COTIZACIÓN ───
    y = this.drawSectionTitle(doc, 'DATOS DEL CLIENTE Y COTIZACIÓN', y, M, W);
    y += 2;

    const clientBoxY = y;
    const clientBoxH = 40;
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, usable, clientBoxH, 2, 2, 'FD');

    const cL = M + 4;
    const cMid = M + usable / 2;
    const rL = cMid + 4;
    let cY = y + 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const drawField = (lx: string, lv: string, rx: string, rv: string, curY: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.GRAY);
      doc.text(lx, cL, curY);
      doc.text(rx, rL, curY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(lv || 'No especificado', cL + 28, curY);
      doc.text(rv || 'No especificado', rL + 28, curY);
    };

    drawField('Señor(es):', cliente.nombre, 'Fecha Emisión:', this.formatDate(orden.fechaEntrada), cY);
    cY += 8;
    drawField('RUC / C.I.:', cliente.cedula, 'Validez Oferta:', orden.validezOferta || '_______ Días', cY);
    cY += 8;
    drawField('Teléfono:', cliente.telefono, 'Forma de Pago:', orden.formaPago || 'Contado / Transferencia', cY);
    cY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('E-mail:', cL, cY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(cliente.email || 'No especificado', cL + 28, cY);

    y = clientBoxY + clientBoxH + 6;

    // ─── DETALLES DEL VEHÍCULO ───
    y = this.drawSectionTitle(doc, 'DETALLES DEL VEHÍCULO', y, M, W);
    y += 2;

    const vehBoxH = 24;
    doc.setDrawColor(...this.BLUE);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, usable, vehBoxH, 2, 2, 'FD');

    let vY = y + 7;
    doc.setFontSize(9);
    const vCol1 = M + 4;
    const vCol2 = cMid;

    // Fila 1: Marca | Modelo
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Marca:', vCol1, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(vehiculo.marca || '-', vCol1 + 14, vY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Modelo:', vCol2, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(vehiculo.modelo || '-', vCol2 + 18, vY);

    vY += 8;

    // Fila 2: Placa | Año/Km
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Placa:', vCol1, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(vehiculo.placa || '-', vCol1 + 14, vY);

    const km = vehiculo.kilometraje ? `${vehiculo.kilometraje} km` : '-';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Año / Km:', vCol2, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(`${vehiculo.anio || '-'} / ${km}`, vCol2 + 22, vY);

    y = y + vehBoxH + 6;

    // ─── DETALLE DE REPUESTOS Y MANO DE OBRA ───
    y = this.drawSectionTitle(doc, 'DETALLE DE REPUESTOS Y MANO DE OBRA', y, M, W);
    y += 2;

    const detalles = orden.detalles || [];
    const tableBody = detalles.map(d => [
      String(d.cantidad || 1),
      d.descripcion || '',
      `$${(d.precioUnitario || 0).toFixed(2)}`,
      `$${(d.subtotal || 0).toFixed(2)}`
    ]);

    if (tableBody.length === 0) {
      tableBody.push(['', '', '', '']);
    }

    autoTable(doc, {
      startY: y,
      head: [['CANT.', 'DESCRIPCIÓN DE TRABAJOS / REPUESTOS', 'V. UNITARIO', 'V. TOTAL']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [40, 40, 40],
        lineColor: [...this.BLUE],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [...this.BLUE],
        textColor: [...this.WHITE],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 100 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: M, right: M },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    // ─── NOTAS + TOTALES (lado a lado) ───
    const notasX = M;
    const totX = W - M - 80;
    const totW = 80;
    const notasW = totX - M - 4;
    const rowY = y;

    // -- Caja de Notas --
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(notasX, rowY, notasW, 34, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('Notas Importantes:', notasX + 3, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    const notasText = `- Los valores presupuestados están sujetos a variación si al desarmar se encuentran daños ocultos adicionales, lo cual será notificado previamente al cliente.
- Los repuestos cotizados están sujetos a disponibilidad de stock en el mercado local/importador.`;
    const splitNotas = doc.splitTextToSize(notasText, notasW - 6);
    doc.text(splitNotas, notasX + 3, rowY + 10);

    // -- Caja de Totales --
    const subtotalMO = detalles
      .filter(d => d.tipo === 'SERVICIO')
      .reduce((s, d) => s + (d.subtotal || 0), 0);
    const subtotalRep = detalles
      .filter(d => d.tipo === 'PRODUCTO')
      .reduce((s, d) => s + (d.subtotal || 0), 0);
    const iva = orden.impuesto || 0;
    const total = orden.total || 0;

    doc.setFillColor(245, 248, 252);
    doc.roundedRect(totX, rowY, totW, 34, 2, 2, 'FD');

    doc.setFontSize(9);
    let tY = rowY + 6;
    const drawTot = (label: string, val: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(label, totX + 4, tY);
      doc.setFont('helvetica', 'bold');
      doc.text(val, totX + totW - 4, tY, { align: 'right' });
      tY += 7;
    };

    drawTot('Subtotal M.O.:', `$${subtotalMO.toFixed(2)}`);
    drawTot('Subtotal Repuestos:', `$${subtotalRep.toFixed(2)}`);
    drawTot('IVA (12%):', `$${iva.toFixed(2)}`);

    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.2);
    doc.line(totX + 4, tY - 1, totX + totW - 4, tY - 1);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('TOTAL:', totX + 4, tY + 4);
    doc.text(`$${total.toFixed(2)}`, totX + totW - 4, tY + 4, { align: 'right' });

    y = rowY + 38;

    // ─── TÉRMINOS Y CONDICIONES ───
    y = this.drawSectionTitle(doc, 'TÉRMINOS Y CONDICIONES DE LA COTIZACIÓN', y, M, W);
    y += 2;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    const termsText = `Esta proforma constituye una estimación económica basada exclusivamente en la revisión visual previa o los síntomas manifestados del vehículo. Toda orden de trabajo derivada de esta proforma requiere la aceptación explícita de los términos de pago acordados. Las partes y piezas sustituidas cuentan con la garantía directa otorgada por el fabricante o proveedor según el rubro correspondiente.`;
    const splitTerms = doc.splitTextToSize(termsText, usable);
    doc.text(splitTerms, M, y);
    y += splitTerms.length * 3.5 + 8;

    // ─── FIRMAS ───
    const firmW = 70;
    const firmGap = 20;
    const firmY = y;

    doc.setDrawColor(...this.GRAY);
    doc.setLineWidth(0.2);

    // Firma izquierda
    doc.line(M, firmY, M + firmW, firmY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('PREPARADO POR:', M, firmY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('M-O Servicio Automotriz', M, firmY + 8);

    // Firma derecha
    const rFirmX = M + firmW + firmGap + 30;
    doc.line(rFirmX, firmY, rFirmX + firmW, firmY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('ACEPTADO CLIENTE:', rFirmX, firmY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Firma de Conformidad Presupuestaria', rFirmX, firmY + 8);

    // ─── PIE DE PÁGINA ───
    doc.setFillColor(...this.BLUE);
    doc.rect(0, this.PAGE_H - 10, W, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.WHITE);
    doc.text('Documento generado por MecanicApp - Sistema de Gestión de Taller Mecánico', W / 2, this.PAGE_H - 4, { align: 'center' });

    doc.save(`Proforma-${orden.codigo}.pdf`);
  }

  private drawSectionTitle(doc: jsPDF, title: string, y: number, M: number, W: number): number {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text(title, M, y);
    y += 2;
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + doc.getTextWidth(title) + 2, y);
    return y + 4;
  }

  private formatDate(date: any): string {
    if (!date) return '____ / ____ / 20___';
    return new Date(date).toLocaleDateString('es-ES');
  }

  private formatTime(date: any): string {
    if (!date) return '_______';
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
