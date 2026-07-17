import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenServicio } from '../services/orden-servicio.service';

@Injectable({ providedIn: 'root' })
export class OrdenTrabajoPdfService {

  private readonly PAGE_W = 210;
  private readonly PAGE_H = 297;
  private readonly MARGIN = 12;
  private readonly BLUE = [26, 60, 94] as const;
  private readonly GRAY = [100, 100, 100] as const;
  private readonly WHITE = [255, 255, 255] as const;

  generarOrdenTrabajo(orden: OrdenServicio, cliente: any, vehiculo: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = this.PAGE_W;
    const H = this.PAGE_H;
    const M = this.MARGIN;
    const usable = W - M * 2;
    let y = M;

    // ═══════════ PÁGINA 1 ═══════════

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

    // ─── TÍTULO ───
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('ORDEN DE TRABAJO', W / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.GRAY);
    doc.text(`N° ${orden.codigo || '0000001'}`, W - M, y, { align: 'right' });
    y += 6;

    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 6;

    // ─── INFORMACIÓN DEL CLIENTE ───
    y = this.sectionTitle(doc, 'INFORMACIÓN DEL CLIENTE', y, M);
    y += 2;

    // Calcular alto necesario según observaciones
    const obsMaxW = usable / 2 - 30;
    const obsText = orden.observaciones || '-';
    const splitObs = doc.splitTextToSize(obsText, obsMaxW);
    const obsLines = Math.min(splitObs.length, 3);
    const cliH = 30 + (obsLines > 1 ? (obsLines - 1) * 4 : 0);

    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, usable, cliH, 2, 2, 'FD');

    const cL = M + 4;
    const cMid = M + usable / 2;
    const rL = cMid + 4;
    let cY = y + 6;
    doc.setFontSize(8);

    const f2 = (lx: string, lv: string, rx: string, rv: string, curY: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.GRAY);
      doc.text(lx, cL, curY);
      doc.text(rx, rL, curY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(lv || '-', cL + 26, curY);
      doc.text(rv || '-', rL + 26, curY);
    };

    f2('Cliente:', cliente.nombre, 'Fecha Ingreso:', this.formatDate(orden.fechaEntrada), cY);
    cY += 7;
    f2('Dirección:', cliente.direccion, 'Hora:', this.formatTime(orden.fechaEntrada), cY);
    cY += 7;
    f2('E-mail:', cliente.email, 'CI / RUC:', cliente.cedula, cY);
    cY += 7;
    f2('Teléfono:', cliente.telefono, 'Observaciones:', '', cY);

    // Observaciones con wrap
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(splitObs.slice(0, 3), rL + 26, cY);

    y += cliH + 5;

    // ─── INFORMACIÓN DEL VEHÍCULO ───
    y = this.sectionTitle(doc, 'INFORMACIÓN DEL VEHÍCULO', y, M);
    y += 2;

    const vehH = 24;
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, usable, vehH, 2, 2, 'FD');

    let vY = y + 6;
    const vC1 = M + 4;
    const vC2 = M + usable / 3 + 4;
    const vC3 = M + (usable * 2) / 3 + 4;

    doc.setFontSize(8);

    const f3 = (c1l: string, c1v: string, c2l: string, c2v: string, c3l: string, c3v: string, curY: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.GRAY);
      doc.text(c1l, vC1, curY);
      doc.text(c2l, vC2, curY);
      doc.text(c3l, vC3, curY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(c1v || '-', vC1 + 18, curY);
      doc.text(c2v || '-', vC2 + 22, curY);
      doc.text(c3v || '-', vC3 + 22, curY);
    };

    f3('Marca:', vehiculo.marca, 'Modelo:', vehiculo.modelo, 'Placa:', vehiculo.placa, vY);
    vY += 8;
    f3('Color:', vehiculo.color, 'Cilindrada:', vehiculo.cilindrada, 'Kilometraje:', orden.kilometrajeIngreso?.toString(), vY);
    vY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Año:', vC1, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(vehiculo.anio?.toString() || '-', vC1 + 18, vY);

    y += vehH + 5;

    // ─── TRABAJOS SOLICITADOS ───
    y = this.sectionTitle(doc, 'TRABAJOS SOLICITADOS', y, M);
    y += 2;

    const allItems = orden.detalles?.map(d => d.descripcion || '') || [];
    const half = Math.ceil(allItems.length / 2);
    const col1 = allItems.slice(0, half);
    const col2 = allItems.slice(half);
    const maxRows = Math.max(col1.length, col2.length, 12);

    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, usable, maxRows * 5.5 + 4, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const checkboxX1 = M + 4;
    const textX1 = M + 10;
    const checkboxX2 = M + usable / 2 + 2;
    const textX2 = M + usable / 2 + 8;

    for (let i = 0; i < maxRows; i++) {
      const rowY = y + 6 + i * 5.5;
      if (i < col1.length) {
        this.checkbox(doc, checkboxX1, rowY - 2.5);
        doc.text(col1[i], textX1, rowY);
      }
      if (i < col2.length) {
        this.checkbox(doc, checkboxX2, rowY - 2.5);
        doc.text(col2[i], textX2, rowY);
      }
    }

    y += maxRows * 5.5 + 8;

    // ─── ESPECIFICACIÓN DE LA AVERÍA ───
    y = this.sectionTitle(doc, 'Especificación de la avería:', y, M);
    y += 1;

    const averia = orden.especificacionAveria || '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    const avSplit = averia ? doc.splitTextToSize(averia, usable - 6) : [];
    const avLines = Math.max(avSplit.length, 1);
    const averiaH = Math.max(14, avLines * 4 + 6);

    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, y, usable, averiaH, 2, 2, 'FD');

    if (averia) {
      doc.text(avSplit, M + 3, y + 5);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text('Escriba la especificación de la avería...', M + 3, y + 5);
    }

    y += averiaH + 5;

    // ─── EL VEHÍCULO INGRESA CON / ESTADO CARROCERÍA ───
    const accItems = ['Radio', 'Tapa gasolina', 'Encendedor', 'Herramientas', 'Moquetas', 'Retrovisores',
      'Espejo interior', 'Plumas', 'Alarma', 'Manuales', 'Extintor', 'Botiquín',
      'Gata y palanca', 'Llaves de ruedas', 'Llanta de repuesto', 'Emblema delantero',
      'Tapacubos', 'Faros delanteros', 'Cenicero', 'Luz de freno', 'Antena', 'Triángulos'];

    const accHalf = Math.ceil(accItems.length / 2);
    const accCol1 = accItems.slice(0, accHalf);
    const accCol2 = accItems.slice(accHalf);
    const accRows = Math.max(accCol1.length, accCol2.length);

    const accH = accRows * 5 + 18;
    const schemaH = 50;
    const seccionEstH = 8 + Math.max(accH, schemaH) + 5;

    if (y + seccionEstH > H - M) {
      doc.addPage();
      y = M;
    }

    y = this.sectionTitle(doc, 'EL VEHÍCULO INGRESA CON / ESTADO CARROCERÍA', y, M);
    y += 2;

    // Dos columnas: izquierda (checklist), derecha (esquema de abolladuras)
    const gapCols = 4;
    const leftW = (usable - gapCols) * 0.52;
    const rightW = usable - gapCols - leftW;
    const leftX = M;
    const rightX = M + leftW + gapCols;
    const colH = Math.max(accH, schemaH);

    // ─── COLUMNA IZQUIERDA: Checklist ───
    doc.setDrawColor(...this.BLUE);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(leftX, y, leftW, colH, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    for (let i = 0; i < accRows; i++) {
      const rowY = y + 5 + i * 5;
      if (i < accCol1.length) {
        this.checkbox(doc, leftX + 3, rowY - 2.5);
        doc.text(accCol1[i], leftX + 8, rowY);
      }
      if (i < accCol2.length) {
        this.checkbox(doc, leftX + leftW / 2 + 1, rowY - 2.5);
        doc.text(accCol2[i], leftX + leftW / 2 + 6, rowY);
      }
    }

    // Estado de carrocería + Nivel de combustible en la misma fila
    const estY = y + accRows * 5 + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...this.GRAY);
    doc.text(`Estado: ${orden.estadoCarroceria || 'No especificado'}`, leftX + 3, estY);

    // Nivel de combustible a la derecha del estado
    const combX = leftX + leftW - 38;
    doc.text('NIVEL DE', combX, estY - 4);
    doc.text('COMBUSTIBLE', combX, estY);
    doc.setDrawColor(...this.GRAY);
    doc.setLineWidth(0.2);
    doc.roundedRect(combX, estY + 2, 34, 8, 1, 1, 'S');

    // ─── COLUMNA DERECHA: Esquema de abolladuras ───
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rightX, y, rightW, colH, 2, 2, 'FD');

    // Título dentro del recuadro
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('ESQUEMA DE ABOLLADURAS,', rightX + rightW / 2, y + 4, { align: 'center' });
    doc.text('GOLPES, QUEBRADOS O RAYADURAS', rightX + rightW / 2, y + 8, { align: 'center' });

    // Layout en cruz - plano técnico
    const schPad = 2.5;
    const schGap = 2;
    const schInnerTop = y + 11;
    const totalW = rightW - schPad * 2;
    const totalH = colH - 13;

    // Dimensiones proporcionales
    const supW = totalW * 0.42;
    const supH = totalH * 0.28;
    const sideW = supW;
    const sideH = (totalH - supH - schGap * 2) / 2;
    const wingW = (totalW - supW - schGap * 2) / 2;
    const wingH = supH;

    // Posiciones
    const centerX = schPad + wingW + schGap;
    const midY = schInnerTop + sideH + schGap;

    const lineColor = this.BLUE;
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.3);

    // ─── VISTA SUPERIOR (centro) ───
    const supX = rightX + centerX;
    const supY = midY;
    doc.roundedRect(supX, supY, supW, supH, 1.5, 1.5, 'S');
    // Rectángulos internos verticales
    const innerLx = supX + supW * 0.28;
    const innerRx = supX + supW * 0.62;
    const innerW1 = supW * 0.08;
    const innerW2 = supW * 0.12;
    const innerGap = 3;
    doc.roundedRect(innerLx, supY + innerGap, innerW1, supH - innerGap * 2, 0.5, 0.5, 'S');
    doc.roundedRect(innerRx, supY + innerGap, innerW2, supH - innerGap * 2, 0.5, 0.5, 'S');
    // Línea vertical punteada (eje central)
    const axisX = supX + supW / 2;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(axisX, supY + 2, axisX, supY + supH - 2);
    doc.setLineDashPattern([], 0);
    // Ranuras superior e inferior
    const slotW = supW * 0.15;
    doc.line(axisX - slotW / 2, supY + 1, axisX + slotW / 2, supY + 1);
    doc.line(axisX - slotW / 2, supY + supH - 1, axisX + slotW / 2, supY + supH - 1);
    // Texto
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('SUPERIOR', supX + supW / 2, supY + supH / 2 + 1.5, { align: 'center' });

    // ─── VISTA FRONTAL (izquierda) ───
    const frX = rightX + schPad;
    const frW = wingW;
    const frH = wingH;
    const frY = midY;
    doc.roundedRect(frX, frY, frW, frH, 1.5, 1.5, 'S');
    // Rectángulo vertical estrecho (borde izquierdo)
    doc.roundedRect(frX + 2, frY + 3, 1.5, frH - 6, 0.3, 0.3, 'S');
    // Círculo esquina superior izquierda
    doc.circle(frX + frW * 0.4, frY + frH * 0.25, 1.5, 'S');
    // Círculo esquina inferior izquierda
    doc.circle(frX + frW * 0.4, frY + frH * 0.75, 1.5, 'S');
    // Texto
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('FRONTAL', frX + frW / 2, frY + frH / 2 + 1.5, { align: 'center' });

    // ─── VISTA POSTERIOR (derecha) ───
    const poX = rightX + centerX + supW + schGap;
    const poW = wingW;
    const poH = wingH;
    const poY = midY;
    doc.roundedRect(poX, poY, poW, poH, 1.5, 1.5, 'S');
    // Rectángulo horizontal (esquina superior izquierda)
    doc.roundedRect(poX + 2, poY + 2, poW * 0.35, 2, 0.3, 0.3, 'S');
    // Rectángulo vertical (borde derecho)
    doc.roundedRect(poX + poW - 3.5, poY + 3, 1.5, poH - 6, 0.3, 0.3, 'S');
    // Cuadrado (esquina inferior izquierda)
    doc.roundedRect(poX + 2, poY + poH - 5, 2.5, 2.5, 0.3, 0.3, 'S');
    // Texto
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('POSTERIOR', poX + poW / 2, poY + poH / 2 + 1.5, { align: 'center' });

    // ─── Función para vista lateral (DERECHO / IZQUIERDO) ───
    const drawSideView = (lx: number, ly: number, lw: number, lh: number, label: string, flipY: boolean) => {
      const arcR = lw / 2;
      const bodyH = lh - arcR;
      // Línea recta (puede ser arriba o abajo según flip)
      const flatY = flipY ? ly : ly + lh;
      const arcCenterY = flipY ? ly + bodyH : ly + arcR;
      // Línea recta
      doc.line(lx, flatY, lx + lw, flatY);
      // Líneas laterales
      if (flipY) {
        doc.line(lx, flatY, lx, ly + bodyH);
        doc.line(lx + lw, flatY, lx + lw, ly + bodyH);
      } else {
        doc.line(lx, flatY, lx, ly + bodyH);
        doc.line(lx + lw, flatY, lx + lw, ly + bodyH);
      }
      // Arco semicircular
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const a1 = flipY ? 0 + (Math.PI * i) / steps : Math.PI + (Math.PI * i) / steps;
        const a2 = flipY ? 0 + (Math.PI * (i + 1)) / steps : Math.PI + (Math.PI * (i + 1)) / steps;
        const x1 = lx + arcR + arcR * Math.cos(a1);
        const y1 = arcCenterY + arcR * Math.sin(a1);
        const x2 = lx + arcR + arcR * Math.cos(a2);
        const y2 = arcCenterY + arcR * Math.sin(a2);
        doc.line(x1, y1, x2, y2);
      }
      // Dos círculos internos alineados horizontalmente (cerca del lado recto)
      const circleY = flipY ? ly + bodyH * 0.45 : ly + lh - bodyH * 0.45;
      doc.circle(lx + lw * 0.25, circleY, 1.5, 'S');
      doc.circle(lx + lw * 0.75, circleY, 1.5, 'S');
      // Texto
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.GRAY);
      doc.text(label, lx + lw / 2, ly + lh / 2 + 1, { align: 'center' });
    };

    // ─── VISTA DERECHO (arriba) - curva arriba, recta abajo ───
    drawSideView(rightX + centerX, schInnerTop, sideW, sideH, 'DERECHO', false);

    // ─── VISTA IZQUIERDO (abajo) - recta arriba (mirando a SUPERIOR), curva abajo ───
    drawSideView(rightX + centerX, midY + supH + schGap, sideW, sideH, 'IZQUIERDO', true);

    y += colH + 5;

    // ─── OBSERVACIONES DE RECEPCIÓN ───
    const obsEstH = 8 + 16 + 5;
    if (y + obsEstH > H - M) {
      doc.addPage();
      y = M;
    }
    y = this.sectionTitle(doc, 'Observaciones de Recepción:', y, M);
    y += 1;

    const obsH = 16;
    doc.setDrawColor(...this.BLUE);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, y, usable, obsH, 2, 2, 'FD');

    // Líneas para escribir
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    for (let i = 0; i < 3; i++) {
      const ly = y + 5 + i * 4;
      doc.line(M + 3, ly, M + usable - 3, ly);
    }

    const obs = orden.observaciones || '';
    if (obs) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(obs, M + 4, y + 5);
    }

    y += obsH + 5;

    // ═══════════ PÁGINA 2 ═══════════
    const condEstH = 8 + 6 + 10 + 18 + 16 + 20 + 5; // título + caja condiciones + firma1 + fecha + firma2 + margen
    if (y + condEstH > H - M) {
      doc.addPage();
      y = M;
    }

    // ─── CONDICIONES DE TRABAJO ───
    y = this.sectionTitle(doc, 'CONDICIONES DE TRABAJO', y, M);
    y += 2;

    const condText = 'Garantizo y aseguro ser el dueño o estar autorizado por el dueño a ordenar la reparación. Por medio de la firma en pie, autorizo realizar los trabajos, usar los materiales y repuestos necesarios para reparar los daños o fallas descritas en esta orden de trabajo. Autorizo realizar fuera de su taller las pruebas que juzguen convenientes para asegurarse la efectividad del trabajo hecho en mi vehículo. Acepto cancelar de contado el valor de la factura de las reparaciones antes de retirar mi vehículo y en caso de no hacerlo, otorgo el derecho al taller de disponer del vehículo antes mencionado en caso de no pagar las reparaciones y repuestos utilizados para amparar su costo, además me someteré al trámite verbal sumario y a los jueces de la ciudad. El taller de servicio no asume responsabilidades de ninguna clase por daño o pérdida en los vehículos en reparación o en prueba dentro o fuera del taller, debido a fenómenos fuera de su control como accidentes, incendios, asaltos, derrumbes, terremotos, inundaciones, etc. No se asume responsabilidad sobre objetos dejados en el vehículo que no sean parte de este y que no consten en la selección y observaciones de esta orden de trabajo. (NO FIRMAR SIN LEER).';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const splitCond = doc.splitTextToSize(condText, usable - 6);
    const condBoxH = splitCond.length * 3.8 + 6;

    doc.setDrawColor(...this.BLUE);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(M, y, usable, condBoxH, 2, 2, 'FD');

    doc.text(splitCond, M + 3, y + 5);

    y += condBoxH + 10;

    // ─── FIRMAS PRINCIPALES ───
    const firmaW = 75;
    const firmaGap = 10;

    // 3 firmas en fila
    const fY1 = y;
    this.drawFirma(doc, M, fY1, firmaW, 'FIRMA DEL CLIENTE', 'AL INGRESAR AL TALLER');
    this.drawFirma(doc, M + firmaW + firmaGap, fY1, firmaW, 'RESPONSABLE QUE RECIBE', 'TÉC. RESPONSABLE DEL TRABAJO');

    y += 18;

    // ─── FECHA DE ENTREGA ───
    const fechaEntregaBoxW = 60;
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(M, y, fechaEntregaBoxW, 16, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('FECHA DE ENTREGA', M + fechaEntregaBoxW / 2, y + 5, { align: 'center' });

    const fechaEnt = orden.fechaEntrega ? this.formatDate(orden.fechaEntrega) : 'F: ____/____/20___';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(fechaEnt, M + fechaEntregaBoxW / 2, y + 11, { align: 'center' });

    y += 22;

    // ─── FIRMA DE RECIBIDO VEHÍCULO ───
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.3);
    doc.setFillColor(245, 248, 252);
    const recW = usable;
    doc.roundedRect(M, y, recW, 20, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text('FIRMA DE RECIBIDO VEHÍCULO', M + recW / 2, y + 6, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...this.GRAY);
    doc.text('AL SALIR DEL TALLER', M + recW / 2, y + 10, { align: 'center' });

    doc.setDrawColor(...this.GRAY);
    doc.setLineWidth(0.2);
    doc.line(M + 20, y + 17, M + recW - 20, y + 17);

    y += 26;

    // ─── LISTA DE VERIFICACIÓN ───
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text('Trabajos realizados:', M, y);
    y += 4;

    doc.setDrawColor(...this.BLUE);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, y, usable, 40, 2, 2, 'FD');

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    for (let i = 1; i <= 6; i++) {
      const ly = y + 4 + i * 5.5;
      doc.line(M + 3, ly, M + usable - 3, ly);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text(`${i}.`, M + 5, ly - 1);
    }

    // ─── PIE ───
    doc.setFillColor(...this.BLUE);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.WHITE);
    doc.text('Documento generado por MecanicApp - Sistema de Gestión de Taller Mecánico', W / 2, H - 4, { align: 'center' });

    doc.save(`Orden-Trabajo-${orden.codigo}.pdf`);
  }

  private sectionTitle(doc: jsPDF, title: string, y: number, M: number): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BLUE);
    doc.text(title, M, y);
    y += 2;
    doc.setDrawColor(...this.BLUE);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + doc.getTextWidth(title) + 2, y);
    return y + 4;
  }

  private checkbox(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(...this.GRAY);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, 3, 3, 'FD');
  }

  private drawFirma(doc: jsPDF, x: number, y: number, w: number, line1: string, line2: string) {
    doc.setDrawColor(...this.GRAY);
    doc.setLineWidth(0.2);
    doc.line(x, y, x + w, y);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.GRAY);
    doc.text(line1, x + w / 2, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(line2, x + w / 2, y + 7, { align: 'center' });
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
