// src/app/services/orden-trabajo-pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenServicio } from '../services/orden-servicio.service';

@Injectable({
  providedIn: 'root'
})
export class OrdenTrabajoPdfService {

  generarOrdenTrabajo(orden: OrdenServicio, cliente: any, vehiculo: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const margin = 15;
    let y = margin;

    // ============ ENCABEZADO ============
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('MECANICAPP', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Taller Mecánico Especializado', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(10);
    doc.text('RUC: 0999999999001 | Tel: (04) 2XXX-XXX | Email: info@mecanicapp.com', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Título ORDEN DE TRABAJO
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('ORDEN DE TRABAJO', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Código de la orden
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`N°: ${orden.codigo}`, pageWidth - margin, y, { align: 'right' });
    y += 10;

    // ============ INFORMACIÓN DEL CLIENTE ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('INFORMACIÓN DEL CLIENTE', margin, y);
    y += 6;

    const clientData = [
      ['Cliente:', cliente.nombre || 'No especificado'],
      ['Dirección:', cliente.direccion || 'No especificado'],
      ['E-mail:', cliente.email || 'No especificado'],
      ['Teléfono:', cliente.telefono || 'No especificado'],
      ['Fecha Ingreso:', new Date(orden.fechaEntrada).toLocaleDateString('es-ES')],
      ['Hora:', new Date(orden.fechaEntrada).toLocaleTimeString('es-ES')],
      ['CI/RUC:', cliente.cedula || 'No especificado'],
      ['Observaciones:', orden.observaciones || 'No especificado']
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: clientData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { cellWidth: 125 }
      },
      margin: { left: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ INFORMACIÓN DEL VEHÍCULO ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('INFORMACIÓN DEL VEHÍCULO', margin, y);
    y += 6;

    const vehicleData = [
      ['Marca:', vehiculo.marca || 'No especificado'],
      ['Color:', vehiculo.color || 'No especificado'],
      ['Año:', vehiculo.anio?.toString() || 'No especificado'],
      ['Modelo:', vehiculo.modelo || 'No especificado'],
      ['Cilindrada:', vehiculo.cilindrada || 'No especificado'],
      ['Placa:', vehiculo.placa || 'No especificado'],
      ['Kilometraje:', vehiculo.kilometraje?.toString() || 'No especificado']
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: vehicleData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { cellWidth: 125 }
      },
      margin: { left: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ TABLA DE SERVICIOS/PRODUCTOS (2 columnas) ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('TRABAJOS SOLICITADOS', margin, y);
    y += 6;

    // Dividir detalles en dos columnas
    const items = orden.detalles?.map(d => d.descripcion || '') || [];
    const columns = [];
    const itemsPerColumn = Math.ceil(items.length / 2);
    
    for (let i = 0; i < items.length; i += itemsPerColumn) {
      columns.push(items.slice(i, i + itemsPerColumn));
    }

    const tableData = [];
    const maxRows = Math.max(columns[0]?.length || 0, columns[1]?.length || 0);
    
    for (let i = 0; i < maxRows; i++) {
      const row: any = [];
      // Columna 1
      row.push(columns[0] && columns[0][i] ? `☐ ${columns[0][i]}` : '');
      // Columna 2
      row.push(columns[1] && columns[1][i] ? `☐ ${columns[1][i]}` : '');
      tableData.push(row);
    }

    autoTable(doc, {
      startY: y,
      head: [['Producto/Servicio', 'Producto/Servicio']],
      body: tableData.length > 0 ? tableData : [['', '']],
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [50, 50, 50]
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 85 }
      },
      margin: { left: margin, right: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ ESPECIFICACIÓN DE AVERÍA ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('ESPECIFICACIÓN DE LA AVERÍA', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    const averiaText = orden.especificacionAveria || 'No especificada';
    const splitAveria = doc.splitTextToSize(averiaText, pageWidth - (margin * 2));
    doc.text(splitAveria, margin, y);
    y += splitAveria.length * 5 + 5;

    // ============ ESTADO CARROCERÍA ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('ESTADO DE CARROCERÍA', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`El vehículo ingresa con: ${orden.estadoCarroceria || 'No especificado'}`, margin, y);
    y += 8;

    // ============ OBSERVACIONES ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('OBSERVACIONES DE RECEPCIÓN', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const obsText = orden.observaciones || 'Ninguna observación registrada';
    const splitObs = doc.splitTextToSize(obsText, pageWidth - (margin * 2));
    doc.text(splitObs, margin, y);
    y += splitObs.length * 5 + 8;

    // ============ CONDICIONES DE TRABAJO ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('CONDICIONES DE TRABAJO', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const conditions = [
      '• Los trabajos serán realizados según lo solicitado.',
      '• El cliente autoriza la realización de los trabajos necesarios.',
      '• Los repuestos y materiales serán facturados según lo utilizado.',
      '• El taller no se responsabiliza por daños preexistentes no reportados.',
      '• El cliente debe retirar el vehículo dentro de los 5 días de finalizado el trabajo.',
      '• Se aplicará un recargo del 1% por día de almacenaje después de la fecha de entrega.'
    ];

    conditions.forEach(condition => {
      doc.text(condition, margin + 5, y);
      y += 5;
    });

    y += 5;

    // ============ FIRMAS Y FECHA DE ENTREGA ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('FIRMAS DE RESPONSABILIDAD', margin, y);
    y += 10;

    const firmaY = y;
    const firmaWidth = 70;
    const firmaHeight = 20;
    const firmaSpacing = 20;

    // Firma del taller
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', margin, firmaY);
    doc.text('Firma del Taller', margin, firmaY + 5);
    doc.text('(MECANICAPP)', margin, firmaY + 10);

    // Firma del cliente
    doc.text('_________________________', margin + firmaWidth + firmaSpacing, firmaY);
    doc.text('Firma del Cliente', margin + firmaWidth + firmaSpacing, firmaY + 5);
    doc.text('(Responsable)', margin + firmaWidth + firmaSpacing, firmaY + 10);

    // ============ FECHA DE ENTREGA ============
    y = firmaY + 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('FECHA DE ENTREGA ESTIMADA', margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const fechaEntrega = orden.fechaEntrega 
      ? new Date(orden.fechaEntrega).toLocaleDateString('es-ES')
      : 'Por definir';
    doc.text(fechaEntrega, margin + 5, y);
    y += 8;

    // ============ FIRMA DE RECIBIDO ============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('FIRMA DE RECIBIDO DEL VEHÍCULO', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', margin, y);
    doc.text('Firma de Recibido', margin, y + 5);
    doc.text('(Conforme)', margin, y + 10);

    // ============ PIE DE PÁGINA ============
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Documento generado por MecanicApp - Sistema de Gestión de Taller Mecánico', pageWidth / 2, footerY, { align: 'center' });

    // ============ GUARDAR PDF ============
    doc.save(`Orden-Trabajo-${orden.codigo}.pdf`);
  }
}