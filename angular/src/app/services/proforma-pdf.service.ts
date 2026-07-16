// src/app/services/proforma-pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdenServicio } from '../services/orden-servicio.service';

@Injectable({
  providedIn: 'root'
})
export class ProformaPdfService {

  generarProforma(orden: OrdenServicio, cliente: any, vehiculo: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Configuración de márgenes
    const margin = 15;
    let y = margin;

    // ============ ENCABEZADO ============
    // Logo y título
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

    // Título PROFORMA
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('PROFORMA', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Código de la proforma
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`Código: ${orden.codigo}`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    // ============ DATOS DEL CLIENTE ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('DATOS DEL CLIENTE', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    // Tabla de datos del cliente
    const clientData = [
      ['Señor(es):', cliente.nombre || 'No especificado'],
      ['RUC/C.I:', cliente.cedula || 'No especificado'],
      ['Teléfono:', cliente.telefono || 'No especificado'],
      ['E-mail:', cliente.email || 'No especificado'],
      ['Fecha Emisión:', new Date(orden.fechaEntrada).toLocaleDateString('es-ES')],
      ['Validez Oferta:', orden.validezOferta || 'No especificado'],
      ['Forma de Pago:', orden.formaPago || 'No especificado']
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: clientData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { cellWidth: 120 }
      },
      margin: { left: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ DATOS DEL VEHÍCULO ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('DATOS DEL VEHÍCULO', margin, y);
    y += 6;

    const vehicleData = [
      ['Marca:', vehiculo.marca || 'No especificado'],
      ['Placa:', vehiculo.placa || 'No especificado'],
      ['Modelo:', vehiculo.modelo || 'No especificado'],
      ['Año:', vehiculo.anio?.toString() || 'No especificado']
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: vehicleData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { cellWidth: 120 }
      },
      margin: { left: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ TABLA DE DETALLES ============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('DETALLES DE TRABAJOS Y REPUESTOS', margin, y);
    y += 6;

    // Preparar datos para la tabla
    const tableRows = orden.detalles?.map(detalle => [
      detalle.cantidad || 1,
      detalle.descripcion || 'No especificado',
      `$${detalle.precioUnitario?.toFixed(2) || '0.00'}`,
      `$${detalle.subtotal?.toFixed(2) || '0.00'}`
    ]) || [];

    autoTable(doc, {
      startY: y,
      head: [['Cant.', 'Descripción de trabajos/repuestos', 'V. Unitario', 'V. Total']],
      body: tableRows,
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
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ RESUMEN DE TOTALES ============
    const subtotal = orden.subtotalServicios + orden.subtotalProductos;
    const iva = orden.impuesto || 0;
    const total = orden.total || 0;

    const summaryData = [
      ['SUBTOTAL:', `$${subtotal.toFixed(2)}`],
      ['IVA (12%):', `$${iva.toFixed(2)}`],
      ['TOTAL:', `$${total.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 3,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: 'bold', halign: 'right' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ============ TÉRMINOS Y CONDICIONES ============
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('NOTAS IMPORTANTES', margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const terms = [
      '• Esta proforma tiene una validez de ' + (orden.validezOferta || '3 días') + '.',
      '• Los precios incluyen IVA.',
      '• Los trabajos serán realizados en el taller del cliente.',
      '• El cliente debe revisar y aprobar la proforma antes de iniciar los trabajos.'
    ];

    terms.forEach(term => {
      doc.text(term, margin + 5, y);
      y += 5;
    });

    y += 3;

    // ============ FIRMAS ============
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('FIRMAS DE RESPONSABILIDAD', margin, y);
    y += 10;

    // Líneas para firmas
    const firmaY = y;
    const firmaWidth = 70;
    const firmaHeight = 20;
    const firmaSpacing = 30;

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

    // ============ PIE DE PÁGINA ============
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Documento generado por MecanicApp - Sistema de Gestión de Taller Mecánico', pageWidth / 2, footerY, { align: 'center' });

    // ============ GUARDAR PDF ============
    doc.save(`Proforma-${orden.codigo}.pdf`);
  }
}