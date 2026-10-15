type RGB = [number, number, number];

export interface MonthlyFinancialRow {
  bulan: string;
  pendapatan: number;
  beban: number;
  surplus: number;
}

export interface ReportLineItem {
  label: string;
  amount: number;
}

export interface BalanceSheetItem {
  name: string;
  value: number;
}

export interface FinancialReportPdfInput {
  year: number;
  schoolName: string;
  reportName: string;
  activeTabLabel: string;
  monthly: MonthlyFinancialRow[];
  income: ReportLineItem[];
  expenses: ReportLineItem[];
  balanceSheet: {
    assets: BalanceSheetItem[];
    liabilities: BalanceSheetItem[];
  };
}

const NAVY: RGB = [21, 45, 79];
const BRAND: RGB = [67, 115, 184];
const PURPLE: RGB = [107, 79, 160];
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

function drawHeader(doc: import('jspdf').jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 595.28, 112, 'F');
  doc.setFillColor(...BRAND);
  doc.rect(0, 104, 595.28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('NexFinance', 42, 44);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem keuangan terpadu sekolah', 42, 64);
  doc.text('Yayasan ISAk 35', 42, 80);

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

function drawFooter(doc: import('jspdf').jsPDF) {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(222, 226, 231);
    doc.line(42, 800, 553, 800);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text('NexFinance • Exported financial report', 42, 818);
    doc.text(`Page ${page} / ${totalPages}`, 553, 818, { align: 'right' });
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
    doc.setFontSize(18);
    doc.text(item.value, x + 12, y + 50, { maxWidth: width - 24 });
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

  const totalPendapatan = input.monthly.reduce((sum, row) => sum + row.pendapatan, 0);
  const totalBeban = input.monthly.reduce((sum, row) => sum + row.beban, 0);
  const totalSurplus = input.monthly.reduce((sum, row) => sum + row.surplus, 0);
  const margin = totalPendapatan ? ((totalSurplus / totalPendapatan) * 100).toFixed(1) : '0.0';
  const totalAssets = input.balanceSheet.assets.reduce((sum, row) => sum + row.value, 0);
  const totalLiabilities = input.balanceSheet.liabilities.reduce((sum, row) => sum + row.value, 0);
  const equity = totalAssets - totalLiabilities;
  const bestMonth = [...input.monthly].sort((a, b) => b.surplus - a.surplus)[0];

  drawHeader(
    pdfDoc,
    input.reportName,
    `${input.schoolName} • Tahun ${input.year} • Fokus tampilan: ${input.activeTabLabel}`
  );

  let cursorY = drawSummaryCards(pdfDoc, [
    { label: 'Pendapatan YTD', value: formatCurrency(totalPendapatan), tone: GREEN, soft: [236, 253, 245] },
    { label: 'Beban YTD', value: formatCurrency(totalBeban), tone: RED, soft: [254, 242, 242] },
    { label: 'Surplus YTD', value: formatCurrency(totalSurplus), tone: BRAND, soft: [238, 243, 251] },
    { label: 'Margin Bersih', value: `${margin}%`, tone: PURPLE, soft: [243, 239, 250] },
  ]);

  cursorY = drawInsightBand(pdfDoc, 'Executive highlights', [
    `Surplus tertinggi terjadi pada bulan ${bestMonth?.bulan || '-'} sebesar ${formatCurrency(bestMonth?.surplus || 0)}.`,
    `Total aset tercatat ${formatCurrency(totalAssets)} dengan ekuitas ${formatCurrency(equity)}.`,
    `Laporan ini dirancang untuk kebutuhan operasional, monitoring pimpinan, dan distribusi PDF ke stakeholder.`,
  ], cursorY);

  autoTable(pdfDoc, {
    startY: cursorY,
    head: [['Kategori', 'Komponen', 'Nilai (IDR)']],
    body: [
      ...input.income.map((item) => ['Pendapatan', item.label, formatNumber(item.amount)]),
      ['Pendapatan', 'Total Pendapatan', formatNumber(totalPendapatan)],
      ...input.expenses.map((item) => ['Beban', item.label, formatNumber(item.amount)]),
      ['Beban', 'Total Beban', formatNumber(totalBeban)],
      ['Ringkasan', 'Surplus Bersih', formatNumber(totalSurplus)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section !== 'body') return;
      if (!Array.isArray(hookData.row.raw)) return;
      const rowLabel = String(hookData.row.raw[0]);
      const itemLabel = String(hookData.row.raw[1]);
      if (hookData.column.index === 2 && rowLabel === 'Pendapatan') {
        hookData.cell.styles.textColor = GREEN;
      }
      if (hookData.column.index === 2 && rowLabel === 'Beban') {
        hookData.cell.styles.textColor = RED;
      }
      if (itemLabel === 'Surplus Bersih') {
        hookData.cell.styles.textColor = BRAND;
        hookData.cell.styles.fillColor = [240, 250, 251];
      }
      if (itemLabel.startsWith('Total ')) {
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 42, right: 42 },
    styles: { cellPadding: 6 },
  });

  cursorY = (pdfDoc.lastAutoTable?.finalY || cursorY) + 24;

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
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
    },
    margin: { left: 42, right: 42 },
    styles: { cellPadding: 6 },
  });

  pdfDoc.addPage();
  drawHeader(pdfDoc, 'Neraca Ringkas', `${input.schoolName} • Snapshot posisi keuangan ${input.year}`);

  autoTable(pdfDoc, {
    startY: 182,
    head: [['Aset', 'Nilai (IDR)']],
    body: [
      ...input.balanceSheet.assets.map((item) => [item.name, formatNumber(item.value)]),
      ['Total Aset', formatNumber(totalAssets)],
    ],
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 42, right: 302 },
    styles: { cellPadding: 6 },
  });

  autoTable(pdfDoc, {
    startY: 182,
    head: [['Kewajiban & Ekuitas', 'Nilai (IDR)']],
    body: [
      ...input.balanceSheet.liabilities.map((item) => [item.name, formatNumber(item.value)]),
      ['Total Kewajiban', formatNumber(totalLiabilities)],
      ['Ekuitas', formatNumber(equity)],
      ['Total Kewajiban + Ekuitas', formatNumber(totalAssets)],
    ],
    headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    bodyStyles: { fontSize: 9, textColor: NAVY },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 308, right: 42 },
    styles: { cellPadding: 6 },
    didParseCell: (hookData) => {
      if (hookData.section !== 'body' || !Array.isArray(hookData.row.raw)) return;
      if (String(hookData.row.raw[0]).includes('Ekuitas')) {
        hookData.cell.styles.textColor = BRAND;
      }
    },
  });

  drawFooter(pdfDoc);
  pdfDoc.save(`NexFinance_Laporan_Keuangan_${input.year}.pdf`);
}
