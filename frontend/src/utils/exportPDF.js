import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const IDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const TEAL = [65, 169, 169];
const NAVY = [44, 62, 80];
const LIGHT = [239, 246, 246];

const header = (doc, title, subtitle) => {
  // Header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(...TEAL);
  doc.rect(0, 28, 210, 4, 'F');

  // Logo + title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NexFinance', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PT Alfarhein Teknologi Investama (Nexora)', 14, 21);
  doc.text('Sekolah Islam Terpadu Al-Musabbihin', 14, 27);

  // Right: date
  doc.setFontSize(8);
  const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(now, 196, 14, { align: 'right' });

  // Report title
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 51);

  // Divider
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(14, 55, 196, 55);

  return 62;
};

const footer = (doc) => {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.3);
    doc.line(14, 284, 196, 284);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('NexFinance — Sistem Keuangan Sekolah Islam Terpadu Al-Musabbihin', 14, 291);
    doc.text(`Halaman ${i} / ${pages}`, 196, 291, { align: 'right' });
  }
};

const summaryBox = (doc, y, items) => {
  const cols = Math.min(items.length, 4);
  const w = (196 - 14) / cols;
  items.forEach((item, i) => {
    const x = 14 + i * w;
    doc.setFillColor(...(item.bg || LIGHT));
    doc.roundedRect(x + 1, y, w - 2, 22, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), x + 5, y + 7);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(item.color || NAVY));
    doc.text(item.value, x + 5, y + 17);
  });
  return y + 28;
};

// ── EXPORT FUNCTIONS ─────────────────────────────────────────────────────────

export const exportSPPReport = (invoices) => {
  const doc = new jsPDF();
  const paid = invoices.filter(i => i.status === 'paid');
  const unpaid = invoices.filter(i => i.status === 'unpaid');
  const totalCollected = paid.reduce((s, i) => s + i.amount, 0);
  const rate = invoices.length ? ((paid.length / invoices.length) * 100).toFixed(1) : 0;

  let y = header(doc, 'Laporan Penagihan SPP', `Per ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);

  y = summaryBox(doc, y, [
    { label: 'Total Invoice', value: String(invoices.length), color: TEAL },
    { label: 'Sudah Lunas', value: String(paid.length), color: [16, 185, 129] },
    { label: 'Belum Bayar', value: String(unpaid.length), color: [245, 158, 11] },
    { label: 'Collection Rate', value: rate + '%', color: TEAL },
  ]);

  y = summaryBox(doc, y, [
    { label: 'Total Terkumpul', value: IDR(totalCollected), color: [16, 185, 129], bg: [209, 250, 229] },
    { label: 'Total Belum Terkumpul', value: IDR(unpaid.reduce((s, i) => s + i.amount, 0)), color: [245, 158, 11], bg: [254, 243, 199] },
  ]);

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['ID Invoice', 'Nama Siswa', 'Kelas', 'Bulan', 'Jumlah (Rp)', 'Jatuh Tempo', 'Status', 'Metode']],
    body: invoices.map(i => [
      i.id, i.studentName, i.class, i.month,
      new Intl.NumberFormat('id-ID').format(i.amount),
      i.dueDate, i.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR',
      i.paymentMethod || '-',
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: { halign: 'right' },
      6: { fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        data.cell.styles.textColor = data.cell.raw === 'LUNAS' ? [16, 185, 129] : [245, 158, 11];
      }
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3.5 },
  });

  footer(doc);
  doc.save(`SPP_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportPayrollReport = (employees, payrollRuns) => {
  const doc = new jsPDF();
  const totalGross = payrollRuns.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet   = payrollRuns.reduce((s, p) => s + p.netSalary, 0);

  let y = header(doc, 'Laporan Penggajian Karyawan', `Rekap Payroll — ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);

  y = summaryBox(doc, y, [
    { label: 'Total Karyawan', value: String(employees.length), color: TEAL },
    { label: 'Total Slip Gaji', value: String(payrollRuns.length), color: NAVY },
    { label: 'Total Gaji Bruto', value: IDR(totalGross), color: TEAL, bg: LIGHT },
    { label: 'Total Take-Home', value: IDR(totalNet), color: [16, 185, 129], bg: [209, 250, 229] },
  ]);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Data Karyawan', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Nama Karyawan', 'Jabatan', 'Gaji Pokok', 'T. Sertifikasi', 'T. Keluarga', 'Bruto Estimasi']],
    body: employees.map(e => {
      const gross = e.baseSalary + e.certificationAllowance + e.familyAllowance;
      return [e.id, e.name, e.position,
        new Intl.NumberFormat('id-ID').format(e.baseSalary),
        new Intl.NumberFormat('id-ID').format(e.certificationAllowance),
        new Intl.NumberFormat('id-ID').format(e.familyAllowance),
        new Intl.NumberFormat('id-ID').format(gross),
      ];
    }),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3.5 },
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Riwayat Slip Gaji', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Karyawan', 'Bulan', 'Bruto', 'BPJS Kes', 'BPJS TK', 'PPh 21', 'Take-Home']],
    body: payrollRuns.map(p => [
      p.employeeName || p.employeeId, p.month,
      new Intl.NumberFormat('id-ID').format(p.grossSalary),
      new Intl.NumberFormat('id-ID').format(p.bpjsKesehatan),
      new Intl.NumberFormat('id-ID').format(p.bpjsKetenagakerjaan),
      new Intl.NumberFormat('id-ID').format(p.pphTER),
      new Intl.NumberFormat('id-ID').format(p.netSalary),
    ]),
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3.5 },
    foot: [['', 'TOTAL', IDR(totalGross), '', '', '', IDR(totalNet)]],
    footStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
  });

  footer(doc);
  doc.save(`Payroll_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportFinancialReport = (data) => {
  const doc = new jsPDF();
  const { monthly, sppData, expenseData, kpi } = data;

  let y = header(doc, 'Laporan Keuangan Komprehensif', `Periode ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} — Standar ISAK 35`);

  // KPI summary
  y = summaryBox(doc, y, [
    { label: 'Total Pendapatan YTD', value: IDR(monthly.reduce((s, m) => s + m.pendapatan, 0)), color: [16, 185, 129], bg: [209, 250, 229] },
    { label: 'Total Beban YTD', value: IDR(monthly.reduce((s, m) => s + m.beban, 0)), color: [239, 68, 68], bg: [254, 226, 226] },
    { label: 'Surplus Dana', value: IDR(monthly.reduce((s, m) => s + m.laba, 0)), color: TEAL, bg: LIGHT },
    { label: 'SPP Collection Rate', value: `${Math.round(sppData.reduce((s, m) => s + m.terkumpul, 0) / sppData.length)}%`, color: [59, 130, 246], bg: [219, 234, 254] },
  ]);

  y += 4;

  // Section: Pendapatan vs Beban
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Ringkasan Pendapatan & Beban Bulanan', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Bulan', 'Pendapatan (Rp)', 'Beban (Rp)', 'Surplus (Rp)', 'Margin (%)']],
    body: monthly.map(m => {
      const margin = m.pendapatan > 0 ? ((m.laba / m.pendapatan) * 100).toFixed(1) : '0';
      return [
        m.bulan,
        new Intl.NumberFormat('id-ID').format(m.pendapatan),
        new Intl.NumberFormat('id-ID').format(m.beban),
        new Intl.NumberFormat('id-ID').format(m.laba),
        margin + '%',
      ];
    }),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = parseFloat(data.cell.raw.replace(/\./g, ''));
        data.cell.styles.textColor = v >= 0 ? [16, 185, 129] : [239, 68, 68];
      }
    },
    foot: [['TOTAL YTD',
      new Intl.NumberFormat('id-ID').format(monthly.reduce((s, m) => s + m.pendapatan, 0)),
      new Intl.NumberFormat('id-ID').format(monthly.reduce((s, m) => s + m.beban, 0)),
      new Intl.NumberFormat('id-ID').format(monthly.reduce((s, m) => s + m.laba, 0)),
      (monthly.reduce((s, m) => s + m.laba, 0) / monthly.reduce((s, m) => s + m.pendapatan, 0) * 100).toFixed(1) + '%',
    ]],
    footStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 4 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Section: Distribusi Beban
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Distribusi Beban Operasional', 14, y);
  y += 4;

  const totalExp = expenseData.reduce((s, e) => s + e.value, 0);
  autoTable(doc, {
    startY: y,
    head: [['Kategori Beban', 'Jumlah (Rp)', 'Persentase (%)']],
    body: expenseData.map(e => [
      e.name,
      new Intl.NumberFormat('id-ID').format(e.value),
      ((e.value / totalExp) * 100).toFixed(1) + '%',
    ]),
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    foot: [['TOTAL', new Intl.NumberFormat('id-ID').format(totalExp), '100.0%']],
    footStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 4 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Section: Koleksi SPP
  if (y < 250) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Tingkat Koleksi SPP Bulanan', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Bulan', 'Target (%)', 'Terkumpul (%)', 'Gap (%)', 'Status']],
      body: sppData.map(s => [
        s.bulan, '100',
        s.terkumpul.toFixed(1),
        (100 - s.terkumpul).toFixed(1),
        s.terkumpul >= 90 ? '✓ Baik' : s.terkumpul >= 80 ? '△ Cukup' : '✗ Perlu Perhatian',
      ]),
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center', fontStyle: 'bold' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const v = data.cell.raw;
          data.cell.styles.textColor = v.startsWith('✓') ? [16, 185, 129] : v.startsWith('△') ? [245, 158, 11] : [239, 68, 68];
        }
      },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 4 },
    });
  }

  footer(doc);
  doc.save(`Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportExpenseReport = (expenses) => {
  const doc = new jsPDF();
  const approved = expenses.filter(e => e.status === 'approved');
  const pending  = expenses.filter(e => e.status === 'pending');
  const rejected = expenses.filter(e => e.status === 'rejected');
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0);

  let y = header(doc, 'Laporan Pengeluaran Operasional', `Per ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);

  y = summaryBox(doc, y, [
    { label: 'Total Pengajuan', value: String(expenses.length), color: TEAL },
    { label: 'Disetujui', value: String(approved.length), color: [16, 185, 129], bg: [209, 250, 229] },
    { label: 'Menunggu', value: String(pending.length), color: [245, 158, 11], bg: [254, 243, 199] },
    { label: 'Total Disetujui', value: IDR(totalApproved), color: TEAL, bg: LIGHT },
  ]);

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['ID', 'Deskripsi', 'Kategori', 'Jumlah (Rp)', 'Tgl Pengajuan', 'Status', 'Approval']],
    body: expenses.map(e => [
      e.id,
      e.description.length > 40 ? e.description.slice(0, 40) + '…' : e.description,
      e.category,
      new Intl.NumberFormat('id-ID').format(e.amount),
      e.submittedAt || '-',
      e.status.toUpperCase(),
      `${e.approvals?.length || 0}/2`,
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: 'right' }, 5: { fontStyle: 'bold' }, 6: { halign: 'center' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const v = data.cell.raw;
        data.cell.styles.textColor = v === 'APPROVED' ? [16, 185, 129] : v === 'PENDING' ? [245, 158, 11] : [239, 68, 68];
      }
    },
    foot: [['', '', 'Total Disetujui', new Intl.NumberFormat('id-ID').format(totalApproved), '', '', '']],
    footStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  footer(doc);
  doc.save(`Expense_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
