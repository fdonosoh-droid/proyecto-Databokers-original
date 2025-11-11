/**
 * DATABROKERS - REPORTS GENERATION SERVICE
 * Servicio para generación de reportes en PDF y Excel
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = new PrismaClient();

// =====================================================
// TIPOS Y CONSTANTES
// =====================================================

interface ReportData {
  titulo: string;
  subtitulo?: string;
  datos: any;
  metadata?: any;
}

interface ReportOptions {
  tipo: 'PDF' | 'EXCEL';
  plantilla: string;
  datos: any;
  filtros?: any;
}

enum ReportTemplates {
  PROPIEDADES = 'PROPIEDADES',
  PROYECTOS = 'PROYECTOS',
  CANJES = 'CANJES',
  PUBLICACIONES = 'PUBLICACIONES',
  KPIS = 'KPIS',
  FINANCIERO = 'FINANCIERO',
  CONSOLIDADO = 'CONSOLIDADO'
}

// =====================================================
// GENERACIÓN DE REPORTES PDF
// =====================================================

/**
 * Generar reporte PDF genérico
 */
export async function generarReportePDF(
  data: ReportData,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: data.titulo,
          Author: 'Sistema Databrokers',
          Subject: data.subtitulo || 'Reporte Generado',
          Keywords: 'databrokers, reporte, inmobiliaria'
        }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      agregarHeaderPDF(doc, data.titulo, data.subtitulo);

      // Contenido
      agregarContenidoPDF(doc, data.datos);

      // Footer
      agregarFooterPDF(doc);

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Agregar header al PDF
 */
function agregarHeaderPDF(doc: PDFKit.PDFDocument, titulo: string, subtitulo?: string) {
  // Logo o título principal
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#1F4E78')
    .text('DATABROKERS', { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Sistema de Gestión Inmobiliaria', { align: 'center' });

  doc.moveDown(1);

  // Línea separadora
  doc
    .strokeColor('#4472C4')
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(1);

  // Título del reporte
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#1F4E78')
    .text(titulo, { align: 'center' });

  if (subtitulo) {
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text(subtitulo, { align: 'center' });
  }

  // Fecha de generación
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor('#999999')
    .text(
      `Fecha de generación: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`,
      { align: 'center' }
    );

  doc.moveDown(2);
}

/**
 * Agregar contenido dinámico al PDF
 */
function agregarContenidoPDF(doc: PDFKit.PDFDocument, datos: any) {
  if (Array.isArray(datos)) {
    // Si son datos tabulares
    agregarTablaPDF(doc, datos);
  } else if (typeof datos === 'object') {
    // Si es un objeto con secciones
    Object.entries(datos).forEach(([seccion, contenido]) => {
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1F4E78')
        .text(seccion.toUpperCase());

      doc.moveDown(0.5);

      if (Array.isArray(contenido)) {
        agregarTablaPDF(doc, contenido);
      } else if (typeof contenido === 'object') {
        agregarDatosClaveValorPDF(doc, contenido);
      } else {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text(String(contenido));
      }

      doc.moveDown(1);
    });
  }
}

/**
 * Agregar tabla al PDF
 */
function agregarTablaPDF(doc: PDFKit.PDFDocument, datos: any[]) {
  if (datos.length === 0) return;

  const keys = Object.keys(datos[0]);
  const columnWidth = (500 / keys.length);

  // Headers
  const startY = doc.y;
  let currentX = 50;

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#FFFFFF');

  // Background de header
  doc
    .rect(50, startY, 500, 20)
    .fill('#4472C4');

  doc.fillColor('#FFFFFF');
  keys.forEach(key => {
    doc.text(
      key.toUpperCase().replace(/_/g, ' '),
      currentX,
      startY + 5,
      { width: columnWidth, align: 'left' }
    );
    currentX += columnWidth;
  });

  doc.moveDown(1.5);

  // Rows
  doc.font('Helvetica').fillColor('#333333');
  
  datos.slice(0, 50).forEach((row, index) => {
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
    }

    const rowY = doc.y;
    currentX = 50;

    // Background alternado
    if (index % 2 === 0) {
      doc.rect(50, rowY, 500, 18).fill('#F8F9FA');
      doc.fillColor('#333333');
    }

    keys.forEach(key => {
      const value = row[key];
      const displayValue = value !== null && value !== undefined 
        ? String(value).substring(0, 50) 
        : '-';

      doc.text(
        displayValue,
        currentX,
        rowY + 3,
        { width: columnWidth, align: 'left' }
      );
      currentX += columnWidth;
    });

    doc.moveDown(1);
  });

  if (datos.length > 50) {
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(`Mostrando 50 de ${datos.length} registros`, { align: 'center' });
  }
}

/**
 * Agregar datos clave-valor al PDF
 */
function agregarDatosClaveValorPDF(doc: PDFKit.PDFDocument, datos: any) {
  Object.entries(datos).forEach(([clave, valor]) => {
    if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#4472C4')
        .text(clave.replace(/_/g, ' ').toUpperCase() + ':');
      
      doc.moveDown(0.3);
      agregarDatosClaveValorPDF(doc, valor);
      doc.moveDown(0.5);
    } else {
      const displayValue = valor !== null && valor !== undefined
        ? String(valor)
        : '-';

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#666666')
        .text(clave.replace(/_/g, ' ') + ': ', { continued: true })
        .font('Helvetica')
        .fillColor('#333333')
        .text(displayValue);
    }
  });
}

/**
 * Agregar footer al PDF
 */
function agregarFooterPDF(doc: PDFKit.PDFDocument) {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Línea separadora
    doc
      .strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, 780)
      .lineTo(550, 780)
      .stroke();

    // Footer text
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(
        `Página ${i + 1} de ${pageCount}`,
        50,
        790,
        { align: 'center' }
      );

    doc.text(
      '© 2025 Databrokers - Sistema de Gestión Inmobiliaria',
      50,
      800,
      { align: 'center' }
    );
  }
}

// =====================================================
// GENERACIÓN DE REPORTES EXCEL
// =====================================================

/**
 * Generar reporte Excel genérico
 */
export async function generarReporteExcel(
  data: ReportData,
  outputPath: string
): Promise<string> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Databrokers';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Crear hoja principal
    const worksheet = workbook.addWorksheet('Reporte', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true
      }
    });

    // Header
    agregarHeaderExcel(worksheet, data.titulo, data.subtitulo);

    // Contenido
    await agregarContenidoExcel(worksheet, data.datos);

    // Guardar archivo
    await workbook.xlsx.writeFile(outputPath);

    return outputPath;

  } catch (error) {
    throw new Error(`Error al generar Excel: ${error.message}`);
  }
}

/**
 * Agregar header al Excel
 */
function agregarHeaderExcel(
  worksheet: ExcelJS.Worksheet,
  titulo: string,
  subtitulo?: string
) {
  // Título principal
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'DATABROKERS';
  titleCell.font = { size: 20, bold: true, color: { argb: 'FF1F4E78' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Subtítulo
  worksheet.mergeCells('A2:F2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = 'Sistema de Gestión Inmobiliaria';
  subtitleCell.font = { size: 10, color: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Título del reporte
  worksheet.mergeCells('A4:F4');
  const reportTitleCell = worksheet.getCell('A4');
  reportTitleCell.value = titulo;
  reportTitleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4E78' } };
  reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(4).height = 25;

  if (subtitulo) {
    worksheet.mergeCells('A5:F5');
    const reportSubtitleCell = worksheet.getCell('A5');
    reportSubtitleCell.value = subtitulo;
    reportSubtitleCell.font = { size: 12, color: { argb: 'FF666666' } };
    reportSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Fecha
  worksheet.mergeCells('A6:F6');
  const dateCell = worksheet.getCell('A6');
  dateCell.value = `Fecha de generación: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`;
  dateCell.font = { size: 9, color: { argb: 'FF999999' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Espacio
  worksheet.addRow([]);
}

/**
 * Agregar contenido al Excel
 */
async function agregarContenidoExcel(worksheet: ExcelJS.Worksheet, datos: any) {
  let currentRow = 8;

  if (Array.isArray(datos)) {
    currentRow = agregarTablaExcel(worksheet, datos, currentRow);
  } else if (typeof datos === 'object') {
    Object.entries(datos).forEach(([seccion, contenido]) => {
      // Título de sección
      const sectionRow = worksheet.getRow(currentRow);
      sectionRow.getCell(1).value = seccion.toUpperCase().replace(/_/g, ' ');
      sectionRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF1F4E78' } };
      sectionRow.height = 20;
      currentRow++;

      if (Array.isArray(contenido)) {
        currentRow = agregarTablaExcel(worksheet, contenido, currentRow);
      } else if (typeof contenido === 'object') {
        currentRow = agregarDatosClaveValorExcel(worksheet, contenido, currentRow);
      }

      currentRow += 2; // Espacio entre secciones
    });
  }

  // Auto-ajustar anchos de columnas
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: false }, cell => {
      const length = cell.value ? String(cell.value).length : 0;
      maxLength = Math.max(maxLength, length);
    });
    column.width = Math.min(maxLength + 2, 50);
  });
}

/**
 * Agregar tabla al Excel
 */
function agregarTablaExcel(
  worksheet: ExcelJS.Worksheet,
  datos: any[],
  startRow: number
): number {
  if (datos.length === 0) return startRow;

  const keys = Object.keys(datos[0]);
  let currentRow = startRow;

  // Headers
  const headerRow = worksheet.getRow(currentRow);
  keys.forEach((key, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = key.toUpperCase().replace(/_/g, ' ');
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 20;
  currentRow++;

  // Data rows
  datos.forEach((row, rowIndex) => {
    const dataRow = worksheet.getRow(currentRow);
    
    keys.forEach((key, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = row[key];
      
      // Formato alternado
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      // Formato de números
      if (typeof row[key] === 'number') {
        if (key.toLowerCase().includes('precio') || 
            key.toLowerCase().includes('comision') ||
            key.toLowerCase().includes('monto')) {
          cell.numFmt = '$#,##0.00';
        } else if (key.toLowerCase().includes('porcentaje') ||
                   key.toLowerCase().includes('tasa')) {
          cell.numFmt = '0.00%';
        }
      }
    });

    currentRow++;
  });

  return currentRow;
}

/**
 * Agregar datos clave-valor al Excel
 */
function agregarDatosClaveValorExcel(
  worksheet: ExcelJS.Worksheet,
  datos: any,
  startRow: number
): number {
  let currentRow = startRow;

  Object.entries(datos).forEach(([clave, valor]) => {
    const row = worksheet.getRow(currentRow);
    
    row.getCell(1).value = clave.replace(/_/g, ' ');
    row.getCell(1).font = { bold: true };
    
    if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
      row.getCell(2).value = JSON.stringify(valor);
    } else {
      row.getCell(2).value = valor;
    }

    currentRow++;
  });

  return currentRow;
}

// =====================================================
// PLANTILLAS DE REPORTES ESPECÍFICOS
// =====================================================

/**
 * Generar reporte de propiedades
 */
export async function generarReportePropiedades(
  tipo: 'PDF' | 'EXCEL',
  filtros?: any
): Promise<string> {
  const where: any = {};
  
  if (filtros?.modelo_negocio_id) {
    where.modelo_negocio_id = filtros.modelo_negocio_id;
  }

  if (filtros?.estado) {
    const estado = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'ESTADO_PROPIEDAD' },
        codigo: filtros.estado
      }
    });
    if (estado) where.estado_propiedad_id = estado.id;
  }

  const propiedades = await prisma.propiedades.findMany({
    where,
    include: {
      tipo_propiedad: true,
      estado_propiedad: true,
      comuna: true
    },
    take: 1000
  });

  const datosReporte = propiedades.map(p => ({
    codigo: p.codigo,
    titulo: p.titulo,
    tipo: p.tipo_propiedad.valor_texto,
    estado: p.estado_propiedad.valor_texto,
    precio: p.precio,
    comuna: p.comuna.valor_texto,
    dormitorios: p.dormitorios,
    banos: p.banos
  }));

  const reportData: ReportData = {
    titulo: 'Reporte de Propiedades',
    subtitulo: `Total: ${propiedades.length} propiedades`,
    datos: datosReporte
  };

  const filename = `reporte_propiedades_${Date.now()}.${tipo.toLowerCase()}`;
  const outputPath = path.join('/tmp', filename);

  if (tipo === 'PDF') {
    return await generarReportePDF(reportData, outputPath);
  } else {
    return await generarReporteExcel(reportData, outputPath);
  }
}

/**
 * Generar reporte de KPIs
 */
export async function generarReporteKPIs(
  tipo: 'PDF' | 'EXCEL',
  periodo?: Date
): Promise<string> {
  const periodoReporte = periodo || new Date();

  const kpis = await prisma.kpi_valores.findMany({
    where: {
      periodo: periodoReporte
    },
    include: {
      kpi: true
    }
  });

  const datosAgrupados = {
    'KPIs Principales': kpis.map(k => ({
      indicador: k.kpi.valor_texto,
      valor: k.valor,
      periodo: format(k.periodo, 'MMMM yyyy', { locale: es })
    }))
  };

  const reportData: ReportData = {
    titulo: 'Reporte de KPIs',
    subtitulo: `Periodo: ${format(periodoReporte, 'MMMM yyyy', { locale: es })}`,
    datos: datosAgrupados
  };

  const filename = `reporte_kpis_${Date.now()}.${tipo.toLowerCase()}`;
  const outputPath = path.join('/tmp', filename);

  if (tipo === 'PDF') {
    return await generarReportePDF(reportData, outputPath);
  } else {
    return await generarReporteExcel(reportData, outputPath);
  }
}

/**
 * Generar reporte financiero
 */
export async function generarReporteFinanciero(
  tipo: 'PDF' | 'EXCEL',
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<string> {
  const where: any = {};
  
  if (fechaInicio || fechaFin) {
    where.fecha_venta = {};
    if (fechaInicio) where.fecha_venta.gte = fechaInicio;
    if (fechaFin) where.fecha_venta.lte = fechaFin;
  }

  const transacciones = await prisma.transacciones.aggregate({
    where,
    _sum: {
      monto_venta: true,
      comision_total: true,
      comision_agencia: true
    },
    _count: true
  });

  const publicaciones = await prisma.publicaciones_corredores.aggregate({
    where: {
      fecha_cierre: where.fecha_venta
    },
    _sum: {
      comision_monto: true
    }
  });

  const datosFinancieros = {
    'Resumen de Ventas': {
      cantidad_transacciones: transacciones._count,
      monto_total_ventas: transacciones._sum.monto_venta || 0,
      comision_total_generada: transacciones._sum.comision_total || 0
    },
    'Comisiones': {
      comision_agencia: transacciones._sum.comision_agencia || 0,
      comision_corredores: publicaciones._sum.comision_monto || 0,
      comision_neta: (transacciones._sum.comision_total || 0) - (publicaciones._sum.comision_monto || 0)
    }
  };

  const reportData: ReportData = {
    titulo: 'Reporte Financiero',
    subtitulo: fechaInicio && fechaFin
      ? `Periodo: ${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')}`
      : 'Todos los periodos',
    datos: datosFinancieros
  };

  const filename = `reporte_financiero_${Date.now()}.${tipo.toLowerCase()}`;
  const outputPath = path.join('/tmp', filename);

  if (tipo === 'PDF') {
    return await generarReportePDF(reportData, outputPath);
  } else {
    return await generarReporteExcel(reportData, outputPath);
  }
}

/**
 * Generar reporte consolidado
 */
export async function generarReporteConsolidado(
  tipo: 'PDF' | 'EXCEL'
): Promise<string> {
  // Obtener resúmenes de todos los módulos
  const [
    totalPropiedades,
    totalProyectos,
    totalCanjes,
    totalPublicaciones
  ] = await Promise.all([
    prisma.propiedades.count(),
    prisma.proyectos.count(),
    prisma.canjes.count(),
    prisma.publicaciones_corredores.count()
  ]);

  const datosConsolidados = {
    'Resumen General': {
      total_propiedades: totalPropiedades,
      total_proyectos: totalProyectos,
      total_canjes: totalCanjes,
      total_publicaciones: totalPublicaciones
    }
  };

  const reportData: ReportData = {
    titulo: 'Reporte Consolidado',
    subtitulo: 'Resumen ejecutivo de todos los módulos',
    datos: datosConsolidados
  };

  const filename = `reporte_consolidado_${Date.now()}.${tipo.toLowerCase()}`;
  const outputPath = path.join('/tmp', filename);

  if (tipo === 'PDF') {
    return await generarReportePDF(reportData, outputPath);
  } else {
    return await generarReporteExcel(reportData, outputPath);
  }
}
