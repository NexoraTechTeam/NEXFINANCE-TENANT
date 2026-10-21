import { toTableBody, type Isak335Note, type StatementRow } from '@/lib/isak335';

type RGB = [number, number, number];

export interface MonthlyFinancialRow {
  bulan: string;
  pendapatan: number;
  beban: number;
  surplus: number;
}

export interface PdfStatement { title: string; subtitle?: string; rows: StatementRow[] }

export interface FinancialReportPdfInput {
  year: number;
  schoolName: string;
  reportName: string;
  activeTabLabel: string;
  monthly: MonthlyFinancialRow[];
  /** e.g. "ISAK 335 (d/h ISAK 35)" and "SAK Entitas Privat". */
  standard: string;
  framework: string;
  /** ISAK 335 statements (one page each) and the notes. */
  statements: PdfStatement[];
  notes: Isak335Note[];
  summary: { revenue: number; expenses: number; surplus: number; netAssets: number };
  /** Tenant palette (hex). Defaults to the Nexora palette. */
  colors?: { navy?: string; primary?: string; secondary?: string };
  /** Used in the downloaded file name, e.g. "al-musabbihin". */
  fileSlug?: string;
}

const hexToRgb = (hex: string | undefined, fallback: RGB): RGB => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Set per export from the tenant palette (browser-only, one export at a time).
let NAVY: RGB = [21, 45, 79];
let BRAND: RGB = [67, 115, 184];
let PURPLE: RGB = [107, 79, 160];
const GREEN: RGB = [16, 185, 129];
const RED: RGB = [239, 68, 68];
const SLATE: RGB = [71, 85, 105];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value || 0);

async function loadPdfModules() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  return { jsPDF, autoTable };
}

function drawHeader(doc: import('jspdf').jsPDF, title: string, subtitle: string, schoolName: string, standard: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 595.28, 112, 'F');
  doc.setFillColor(...BRAND);
  doc.rect(0, 104, 595.28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(schoolName.length > 34 ? 17 : 22);
  doc.text(doc.splitTextToSize(schoolName, 330)[0], 42, 46);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Laporan keuangan entitas berorientasi nonlaba — ${standard}`, 42, 66);
  doc.text('Disusun dengan NexFinance', 42, 82);

  const dateText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(title, 42, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(subtitle, 42, 170);
  doc.text(dateText, 553, 46, { align: 'right' });
}

function drawFooter(doc: import('jspdf').jsPDF, footerLabel: string) {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(222, 226, 231);
    doc.line(42, 800, 553, 800);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text(`${footerLabel} • Laporan keuangan`, 42, 818);
    doc.text(`Halaman ${page} / ${totalPages}`, 553, 818, { align: 'right' });
  }
}

function drawSummaryCards(
  doc: import('jspdf').jsPDF,
  items: Array<{ label: string; value: string; tone: RGB; soft: RGB }>
) {
  const width = 120;
  const gap = 10;
  const y = 192;

  items.forEach((item, index) => {
    const x = 42 + index * (width + gap);
    doc.setFillColor(...item.soft);
    doc.roundedRect(x, y, width, 70, 14, 14, 'F');
    doc.setDrawColor(...item.tone);
    doc.setLineWidth(1.2);
    doc.line(x, y + 6, x + width, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...item.tone);
    doc.text(item.label.toUpperCase(), x + 12, y + 26, { maxWidth: width - 24 });
    // Shrink long amounts to fit on one line (e.g. "Rp 125.000.000").
    let size = 18;
    doc.setFontSize(size);
    while (size > 9 && doc.getTextWidth(item.value) > width - 24) {
      size -= 1;
      doc.setFontSize(size);
    }
    doc.text(item.value, x + 12, y + 50);
  });

  return y + 94;
}

function drawInsightBand(
  doc: import('jspdf').jsPDF,
  title: string,
  insights: string[],
  startY: number
) {
  doc.setFillColor(243, 247, 249);
  doc.roundedRect(42, startY, 511, 78, 16, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(title, 58, startY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  insights.forEach((insight, index) => {
    doc.text(`• ${insight}`, 58, startY + 44 + index * 15);
  });

  return startY + 98;
}

export async function downloadFinancialReportPdf(input: FinancialReportPdfInput) {
  const { jsPDF, autoTable } = await loadPdfModules();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pdfDoc = doc as import('jspdf').jsPDF & { lastAutoTable?: { finalY: number } };
  NAVY = hexToRgb(input.colors?.navy, [21, 45, 79]);
  BRAND = hexToRgb(input.colors?.primary, [67, 115, 184]);
  PURPLE = hexToRgb(input.colors?.secondary, [107, 79, 160]);

  const { revenue, expenses, surplus, netAssets } = input.summary;
  const bestMonth = [...input.monthly].sort((a, b) => b.surplus - a.surplus)[0];

  drawHeader(pdfDoc, input.reportName, `${input.schoolName} • Tahun ${input.year} • ${input.framework}`, input.schoolName, input.standard);

  let cursorY = drawSummaryCards(pdfDoc, [
    { label: 'Total pendapatan', value: formatCurrency(revenue), tone: GREEN, soft: [236, 253, 245] },
    { label: 'Total beban', value: formatCurrency(expenses), tone: RED, soft: [254, 242, 242] },
    { label: 'Penghasilan komprehensif', value: formatCurrency(surplus), tone: BRAND, soft: [238, 243, 251] },
    { label: 'Total aset neto', value: formatCurrency(netAssets), tone: PURPLE, soft: [243, 239, 250] },
  ]);

  cursorY = drawInsightBand(pdfDoc, 'Sorotan', [
    `Surplus bulanan tertinggi: ${bestMonth?.bulan || '-'} sebesar ${formatCurrency(bestMonth?.surplus || 0)}.`,
    `Laporan disusun sesuai ${input.standard} berdasarkan ${input.framework}.`,
    'Rincian lima komponen laporan keuangan tersedia pada halaman berikutnya.',
  ], cursorY);

  autoTable(pdfDoc, {
    startY: cursorY,
    head: [['Bulan', 'Pendapatan', 'Beban', 'Surplus', 'Margin']],
    body: input.monthly.map((row) => [
      row.bulan,
      formatNumber(row.pendapatan),
      formatNumber(row.beban),
      formatNumber(row.surplus),
      `${row.pendapatan ? ((row.surplus / row.pendapatan) * 100).toFixed(1) : '0.0'}%`,
    ]),
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right' } },
    margin: { left: 42, right: 42 },
    styles: { cellPadding: 6 },
  });

  // One page per ISAK 335 statement, same rows as the reports page.
  for (const statement of input.statements) {
    pdfDoc.addPage();
    drawHeader(pdfDoc, statement.title, `${input.schoolName} • ${statement.subtitle || `Tahun ${input.year}`}`, input.schoolName, input.standard);
    autoTable(pdfDoc, {
      startY: 186,
      head: [['Uraian', 'Jumlah (Rp)']],
      body: toTableBody(statement.rows),
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
      bodyStyles: { fontSize: 9, textColor: NAVY },
      columnStyles: { 1: { halign: 'right', cellWidth: 140 } },
      margin: { left: 42, right: 42 },
      styles: { cellPadding: 5 },
      didParseCell: (hookData) => {
        if (hookData.section !== 'body') return;
        const kind = statement.rows[hookData.row.index]?.kind;
        if (kind === 'section') { hookData.cell.styles.fontStyle = 'bold'; hookData.cell.styles.textColor = BRAND; hookData.cell.styles.fillColor = [243, 246, 250]; }
        if (kind === 'line' && hookData.column.index === 0) hookData.cell.styles.cellPadding = { top: 5, bottom: 5, left: 18, right: 5 };
        if (kind === 'subtotal') hookData.cell.styles.fontStyle = 'bold';
        if (kind === 'total') { hookData.cell.styles.fontStyle = 'bold'; hookData.cell.styles.fillColor = [236, 241, 248]; }
      },
    });
  }

  pdfDoc.addPage();
  drawHeader(pdfDoc, 'Catatan atas Laporan Keuangan', `${input.schoolName} • Tahun ${input.year}`, input.schoolName, input.standard);
  let y = 192;
  const ensureSpace = (needed: number) => {
    if (y + needed > 780) { pdfDoc.addPage(); y = 60; }
  };
  for (const note of input.notes) {
    ensureSpace(40);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.setTextColor(...NAVY);
    pdfDoc.text(`${note.id}. ${note.title}`, 42, y);
    y += 16;
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(9.5);
    pdfDoc.setTextColor(...SLATE);
    for (const paragraph of note.paragraphs || []) {
      const wrapped = pdfDoc.splitTextToSize(paragraph, 511);
      ensureSpace(wrapped.length * 13);
      pdfDoc.text(wrapped, 42, y);
      y += wrapped.length * 13 + 4;
    }
    if (note.rows) {
      autoTable(pdfDoc, {
        startY: y,
        body: note.rows.length ? toTableBody(note.rows.map((r) => ({ ...r, kind: 'line' as const }))) : [['Tidak ada saldo/transaksi pada periode ini.', '']],
        bodyStyles: { fontSize: 9, textColor: NAVY },
        columnStyles: { 1: { halign: 'right', cellWidth: 140 } },
        margin: { left: 54, right: 42 },
        styles: { cellPadding: 4 },
        theme: 'plain',
      });
      y = (pdfDoc.lastAutoTable?.finalY || y) + 14;
    }
    y += 6;
  }

  drawFooter(pdfDoc, input.schoolName);
  const slug = (input.fileSlug || 'nexfinance').replace(/[^a-z0-9-]/gi, '');
  pdfDoc.save(`${slug}_Laporan_Keuangan_${input.year}.pdf`);
}
