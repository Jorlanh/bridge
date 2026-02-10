import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { createWriteStream } from "fs";
import { join } from "path";
import { Campaign } from "../models/Campaign.js";
import { Deal } from "../models/Deal.js";
import { Ticket } from "../models/Ticket.js";
import { Post } from "../models/Post.js";
import { Enrollment } from "../models/Enrollment.js";
import { Task } from "../models/Task.js";
import { ReportTemplate } from "../models/ReportTemplate.js";

export interface ReportOptions {
  module: string;
  format: "pdf" | "excel" | "csv";
  fields?: string[];
  filters?: Record<string, any>;
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId: string;
  templateId?: string;
  title?: string;
  includeCharts?: boolean;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Gera um relatório em PDF com formatação avançada
 */
export async function generatePDFReport(data: any[], options: ReportOptions, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: options.title || `Relatório ${options.module}`,
          Author: 'BridgeAI Hub',
          Subject: `Relatório de ${options.module}`,
        }
      });
      const stream = createWriteStream(outputPath);
      
      doc.pipe(stream);

      // Cabeçalho melhorado
      doc.fontSize(24).font("Helvetica-Bold").text(options.title || "Relatório", { align: "center" });
      doc.fontSize(14).font("Helvetica").text(`Módulo: ${getModuleName(options.module)}`, { align: "center" });
      
      // Período se fornecido
      if (options.dateRange) {
        doc.fontSize(10).text(
          `Período: ${options.dateRange.start.toLocaleDateString("pt-BR")} a ${options.dateRange.end.toLocaleDateString("pt-BR")}`,
          { align: "center" }
        );
      }
      
      doc.moveDown();
      
      // Data de geração
      doc.fontSize(9).fillColor("#666666").text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`, 
        { align: "right" }
      );
      doc.fillColor("#000000");
      doc.moveDown(2);

      // Resumo estatístico
      if (data.length > 0) {
        doc.fontSize(11).font("Helvetica-Bold").text("Resumo", { underline: true });
        doc.fontSize(10).font("Helvetica");
        doc.text(`Total de registros: ${data.length}`, { indent: 20 });
        
        // Estatísticas numéricas se houver campos numéricos
        const numericFields = options.fields?.filter(field => {
          return data.some(item => typeof item[field] === 'number');
        }) || [];
        
        if (numericFields.length > 0) {
          doc.moveDown(0.5);
          numericFields.forEach(field => {
            const values = data.map(item => item[field]).filter(v => typeof v === 'number');
            if (values.length > 0) {
              const sum = values.reduce((a, b) => a + b, 0);
              const avg = sum / values.length;
              doc.text(`${field}: Total R$ ${sum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Média R$ ${avg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, { indent: 20 });
            }
          });
        }
        
        doc.moveDown(2);
      }

      // Tabela de dados
      if (data.length > 0) {
        const tableTop = doc.y;
        const itemHeight = 20;
        const pageHeight = 750;
        const pageWidth = 550;
        
        // Determinar headers
        let headers: string[] = [];
        if (options.fields && options.fields.length > 0) {
          headers = options.fields;
        } else if (data.length > 0) {
          headers = Object.keys(data[0]);
        }
        
        // Calcular largura das colunas
        const columnCount = headers.length;
        const columnWidth = Math.min(120, (pageWidth - 100) / columnCount);
        
        // Cabeçalho da tabela
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
        let x = 50;
        
        // Fundo cinza para cabeçalho
        doc.rect(50, tableTop - 5, pageWidth, 20).fill("#333333");
        
        headers.forEach((header, index) => {
          const label = formatHeaderLabel(header);
          doc.text(label, x + (index * columnWidth), tableTop + 2, { 
            width: columnWidth - 5,
            ellipsis: true
          });
        });

        doc.fillColor("#000000");

        // Linha separadora
        doc.moveTo(50, tableTop + 20).lineTo(50 + pageWidth, tableTop + 20).stroke();

        // Dados
        doc.fontSize(9).font("Helvetica");
        let y = tableTop + 30;

        data.forEach((item, index) => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = 50;
            // Redesenhar cabeçalho em nova página
            doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
            doc.rect(50, y - 5, pageWidth, 20).fill("#333333");
            headers.forEach((header, colIndex) => {
              const label = formatHeaderLabel(header);
              doc.text(label, 50 + (colIndex * columnWidth), y + 2, { 
                width: columnWidth - 5,
                ellipsis: true
              });
            });
            doc.fillColor("#000000");
            doc.moveTo(50, y + 20).lineTo(50 + pageWidth, y + 20).stroke();
            y = y + 30;
          }

          // Alternar cor de fundo para linhas
          if (index % 2 === 0) {
            doc.rect(50, y - 3, pageWidth, itemHeight).fill("#F5F5F5");
          }

          headers.forEach((header, colIndex) => {
            const value = formatValue(item[header], header);
            doc.fillColor("#000000");
            doc.text(String(value || "-"), 50 + (colIndex * columnWidth), y, { 
              width: columnWidth - 5,
              ellipsis: true
            });
          });

          y += itemHeight;
        });
      } else {
        doc.fontSize(12).text("Nenhum dado encontrado para o período selecionado.", { align: "center" });
      }

      // Rodapé em todas as páginas
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor("#666666").text(
          `BridgeAI Hub - Sistema de Gestão | Página ${i + 1} de ${totalPages}`,
          50,
          doc.page.height - 30,
          { align: "center" }
        );
      }

      doc.end();
      
      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Formata label do cabeçalho
 */
function formatHeaderLabel(header: string): string {
  return header
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Retorna nome amigável do módulo
 */
function getModuleName(module: string): string {
  const names: Record<string, string> = {
    marketing: "Marketing",
    sales: "Vendas",
    support: "Suporte",
    social: "Redes Sociais",
    processes: "Processos",
    academy: "Academia",
    dashboard: "Dashboard"
  };
  return names[module] || module;
}

/**
 * Gera um relatório em Excel com formatação avançada
 */
export async function generateExcelReport(data: any[], options: ReportOptions, outputPath: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Relatório");

  // Cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  worksheet.mergeCells("A1:Z1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = options.title || "Relatório";
  titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2E7D32" },
  };

  worksheet.getCell("A2").value = `Módulo: ${getModuleName(options.module)}`;
  worksheet.getCell("A2").font = { bold: true };
  
  if (options.dateRange) {
    worksheet.getCell("A3").value = `Período: ${options.dateRange.start.toLocaleDateString("pt-BR")} a ${options.dateRange.end.toLocaleDateString("pt-BR")}`;
  }
  
  worksheet.getCell("A4").value = `Gerado em: ${new Date().toLocaleString("pt-BR")}`;
  worksheet.getCell("A4").font = { italic: true, color: { argb: "FF666666" } };

  // Tabela de dados
  if (data.length > 0) {
    const headers = options.fields || Object.keys(data[0]);
    const startRow = 6;
    
    // Cabeçalhos da tabela
    const headerRowData = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = headerRowData.getCell(index + 1);
      cell.value = formatHeaderLabel(header);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF424242" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRowData.height = 25;

    // Dados
    data.forEach((item, index) => {
      const row = worksheet.getRow(startRow + 1 + index);
      headers.forEach((header, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        const value = item[header];
        
        // Formatação baseada no tipo
        if (typeof value === 'number') {
          if (header.toLowerCase().includes('valor') || header.toLowerCase().includes('preço') || header.toLowerCase().includes('value')) {
            cell.value = value;
            cell.numFmt = '"R$" #,##0.00';
          } else if (header.toLowerCase().includes('percent') || header.toLowerCase().includes('taxa')) {
            cell.value = value / 100;
            cell.numFmt = '0.00%';
          } else {
            cell.value = value;
            cell.numFmt = '#,##0';
          }
        } else if (value instanceof Date) {
          cell.value = value;
          cell.numFmt = 'dd/mm/yyyy';
        } else {
          cell.value = formatValue(value, header);
        }
        
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
        
        // Alternar cor de fundo
        if (index % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }
      });
    });

    // Ajustar largura das colunas automaticamente
    headers.forEach((header, index) => {
      let maxLength = formatHeaderLabel(header).length;
      data.forEach(item => {
        const value = String(formatValue(item[header], header));
        if (value.length > maxLength) maxLength = value.length;
      });
      worksheet.getColumn(index + 1).width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Congelar primeira linha de dados
    worksheet.views = [{
      state: 'frozen',
      ySplit: startRow,
    }];
  } else {
    worksheet.getCell("A6").value = "Nenhum dado encontrado para o período selecionado.";
    worksheet.getCell("A6").font = { italic: true, color: { argb: "FF999999" } };
  }

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

/**
 * Gera um relatório em CSV
 */
export async function generateCSVReport(data: any[], options: ReportOptions, outputPath: string): Promise<string> {
  const createCsvWriter = (await import("csv-writer")).createObjectCsvWriter;
  
  const headers = options.fields || (data.length > 0 ? Object.keys(data[0]) : []);
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: headers.map((header) => ({ id: header, title: header })),
    encoding: "utf8",
  });

  await csvWriter.writeRecords(data);
  return outputPath;
}

/**
 * Formata um valor baseado no tipo e campo
 */
function formatValue(value: any, field?: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("pt-BR");
  }

  if (typeof value === "number") {
    // Formatação especial para campos monetários
    if (field && (field.toLowerCase().includes('valor') || field.toLowerCase().includes('preço') || field.toLowerCase().includes('value'))) {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Formatação para percentuais
    if (field && (field.toLowerCase().includes('percent') || field.toLowerCase().includes('taxa'))) {
      return `${value}%`;
    }
    return value.toLocaleString("pt-BR");
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Busca dados de um módulo específico
 */
export async function fetchModuleData(module: string, userId: string, filters?: Record<string, any>): Promise<any[]> {
  switch (module) {
    case "marketing":
      return await Campaign.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
    case "sales":
      return await Deal.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
    case "support":
      return await Ticket.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
    case "social":
      return await Post.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
    case "academy":
      return await Enrollment.find({ userId, ...filters })
        .populate("courseId", "title category")
        .sort({ createdAt: -1 })
        .lean();
    case "processes":
      return await Task.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
    default:
      return [];
  }
}

/**
 * Gera relatório completo
 */
export async function generateReport(options: ReportOptions): Promise<string> {
  // Carregar template se fornecido
  let template = null;
  if (options.templateId) {
    template = await ReportTemplate.findOne({ _id: options.templateId, userId: options.userId });
    if (template) {
      // Aplicar configurações do template
      if (!options.fields && template.fields.length > 0) {
        options.fields = template.fields.map(f => f.field);
      }
      if (!options.filters && template.filters.length > 0) {
        options.filters = {};
        template.filters.forEach(filter => {
          if (filter.operator === "equals") {
            options.filters![filter.field] = filter.value;
          }
        });
      }
      if (!options.groupBy && template.groupBy) {
        options.groupBy = template.groupBy;
      }
      if (!options.sortBy && template.sortBy) {
        options.sortBy = template.sortBy;
        options.sortOrder = template.sortOrder || "asc";
      }
      if (template.includeCharts !== undefined) {
        options.includeCharts = template.includeCharts;
      }
      if (!options.title) {
        options.title = template.name;
      }
    }
  }

  // Buscar dados
  let data = await fetchModuleData(options.module, options.userId, options.filters);

  // Filtrar por data se fornecido
  if (options.dateRange) {
    data = data.filter((item: any) => {
      const itemDate = new Date(item.createdAt || item.startDate || item.date || item.updatedAt);
      return itemDate >= options.dateRange!.start && itemDate <= options.dateRange!.end;
    });
  }

  // Agrupar dados se solicitado
  if (options.groupBy && data.length > 0) {
    const grouped: Record<string, any[]> = {};
    data.forEach((item: any) => {
      const key = String(item[options.groupBy!] || "Outros");
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    // Converter para array de grupos (para relatórios futuros)
    // Por enquanto, mantemos os dados originais
  }

  // Ordenar dados se solicitado
  if (options.sortBy && data.length > 0) {
    data.sort((a: any, b: any) => {
      const aVal = a[options.sortBy!];
      const bVal = b[options.sortBy!];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // Gerar arquivo
  const timestamp = Date.now();
  const ext = options.format === "excel" ? "xlsx" : options.format;
  const filename = `relatorio_${options.module}_${timestamp}.${ext}`;
  const uploadsDir = join(process.cwd(), "uploads", "reports");

  // Garantir que o diretório existe
  const fs = await import("fs/promises");
  await fs.mkdir(uploadsDir, { recursive: true });

  const outputPath = join(uploadsDir, filename);

  switch (options.format) {
    case "pdf":
      await generatePDFReport(data, options, outputPath);
      break;
    case "excel":
      await generateExcelReport(data, options, outputPath);
      break;
    case "csv":
      await generateCSVReport(data, options, outputPath);
      break;
    default:
      throw new Error("Formato não suportado");
  }

  return `/uploads/reports/${filename}`;
}

