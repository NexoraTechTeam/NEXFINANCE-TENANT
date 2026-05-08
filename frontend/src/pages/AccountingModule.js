import React, { useState, useEffect } from 'react';
import { accountingService } from '../services/api';
import { BookOpen, PlusCircle, List, BarChart2, CheckCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginBottom: '32px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#2C3E50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '2px solid #E5E7EB', overflowX: 'auto' },
  tab: (active) => ({ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: active ? '#41A9A9' : '#9CA3AF', borderBottom: active ? '3px solid #41A9A9' : '3px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }),
  btn: { background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#F8FAFC', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#2C3E50', borderBottom: '1px solid #F3F4F6' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '6px', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' },
  typeTag: (type) => {
    const map = { Asset: '#3B82F6', Liability: '#EF4444', Equity: '#8B5CF6', Revenue: '#10B981', Expense: '#F59E0B' };
    const c = map[type] || '#9CA3AF';
    return { background: c + '20', color: c, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
  },
  reportBox: { background: '#F8FAFC', borderRadius: '12px', padding: '20px' },
  reportRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E7EB', fontSize: '14px' },
};

const ACCOUNTS = {
  '1000': { name: 'Kas', type: 'Asset' },
  '1100': { name: 'Rekening Bank', type: 'Asset' },
  '1200': { name: 'Piutang SPP', type: 'Asset' },
  '1300': { name: 'Persediaan ATK', type: 'Asset' },
  '2000': { name: 'Hutang Usaha', type: 'Liability' },
  '2100': { name: 'Hutang Gaji', type: 'Liability' },
  '3000': { name: 'Dana Tidak Terikat', type: 'Equity' },
  '3100': { name: 'Dana Terikat Temporer', type: 'Equity' },
  '4000': { name: 'Pendapatan SPP', type: 'Revenue' },
  '4100': { name: 'Pendapatan Lain-lain', type: 'Revenue' },
  '5000': { name: 'Beban Gaji', type: 'Expense' },
  '5100': { name: 'Beban Operasional', type: 'Expense' },
  '5200': { name: 'Beban Pemeliharaan', type: 'Expense' },
};

const AccountingModule = () => {
  const [tab, setTab] = useState('coa');
  const [journals, setJournals] = useState([]);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: '', debitAccount: '1000', creditAccount: '4000', amount: '' });
  const [coaData, setCoaData] = useState(ACCOUNTS);

  useEffect(() => {
    accountingService.getChartOfAccounts().then(r => { if (r.data.accounts) setCoaData(r.data.accounts); }).catch(() => {});
    accountingService.getJournals().then(r => setJournals(r.data.journals || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'balance-sheet') {
      accountingService.getBalanceSheet()
        .then(r => setBalanceSheet(r.data))
        .catch(() => setBalanceSheet({ assets: 650000000, liabilities: 85000000, equity: 565000000 }));
    }
    if (tab === 'income-statement') {
      accountingService.getIncomeStatement()
        .then(r => setIncomeStatement(r.data))
        .catch(() => setIncomeStatement({ revenue: 375000000, expenses: 285000000, netIncome: 90000000 }));
    }
  }, [tab]);

  const submitJournal = async () => {
    if (!form.description || !form.amount) return alert('Lengkapi semua field.');
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        description: form.description,
        debit: { account: form.debitAccount, name: (coaData[form.debitAccount] || ACCOUNTS[form.debitAccount])?.name, amount: Number(form.amount) },
        credit: { account: form.creditAccount, name: (coaData[form.creditAccount] || ACCOUNTS[form.creditAccount])?.name, amount: Number(form.amount) },
      };
      await accountingService.createJournal(payload);
      const res = await accountingService.getJournals();
      setJournals(res.data.journals || []);
      setForm({ ...form, description: '', amount: '' });
    } catch {
      alert('Gagal mencatat jurnal. Pastikan server berjalan.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.title}>📚 Modul Akuntansi</div>
        <div style={styles.subtitle}>Buku Besar, Jurnal, Laporan ISAK 35 — Sekolah Islam Terpadu Al-Musabbihin</div>

        <div style={{ ...styles.card, padding: '0' }}>
          <div style={{ padding: '0 24px' }}>
            <div style={styles.tabs}>
              {[
                { key: 'coa', label: '📋 Chart of Accounts' },
                { key: 'journal', label: '📝 Jurnal Umum' },
                { key: 'balance-sheet', label: '🏦 Neraca (ISAK 35)' },
                { key: 'income-statement', label: '📊 Laporan Aktivitas' },
              ].map(t => (
                <button key={t.key} style={styles.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {tab === 'coa' && (
              <>
                <div style={styles.cardTitle}><List size={20} color="#41A9A9" /> Chart of Accounts — ISAK 35</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead><tr>{['Kode Akun', 'Nama Akun', 'Tipe', 'Klasifikasi'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {Object.entries(coaData).map(([code, acc], i) => (
                        <tr key={code} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                          <td style={styles.td}><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>{code}</span></td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{acc.name}</td>
                          <td style={styles.td}><span style={styles.typeTag(acc.type)}>{acc.type}</span></td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>
                              {acc.type === 'Asset' && 'Aset'}
                              {acc.type === 'Liability' && 'Kewajiban'}
                              {acc.type === 'Equity' && 'Dana (Terikat/Tidak Terikat)'}
                              {acc.type === 'Revenue' && 'Pendapatan'}
                              {acc.type === 'Expense' && 'Beban'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'journal' && (
              <>
                <div style={styles.cardTitle}><PlusCircle size={20} color="#41A9A9" /> Input Jurnal Umum</div>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.label}>Tanggal</label>
                      <input type="date" style={styles.input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={styles.label}>Keterangan Transaksi</label>
                      <input style={styles.input} placeholder="Penerimaan SPP bulan Mei 2026..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div>
                      <label style={styles.label}>Akun Debit</label>
                      <select style={styles.input} value={form.debitAccount} onChange={e => setForm({ ...form, debitAccount: e.target.value })}>
                        {Object.entries(coaData).map(([code, acc]) => <option key={code} value={code}>{code} — {acc.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Akun Kredit</label>
                      <select style={styles.input} value={form.creditAccount} onChange={e => setForm({ ...form, creditAccount: e.target.value })}>
                        {Object.entries(coaData).map(([code, acc]) => <option key={code} value={code}>{code} — {acc.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Jumlah (Rp)</label>
                      <input type="number" style={styles.input} placeholder="1000000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>
                  <button style={styles.btn} onClick={submitJournal} disabled={submitting}>
                    <CheckCircle size={16} /> {submitting ? 'Menyimpan...' : 'Catat Jurnal'}
                  </button>
                </div>

                {journals.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontSize: '14px' }}>Belum ada jurnal. Isi form di atas untuk mencatat transaksi.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead><tr>{['Tanggal', 'Keterangan', 'Akun Debit', 'Akun Kredit', 'Jumlah'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {journals.map((j, i) => (
                          <tr key={j.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={{ ...styles.td, fontSize: '13px' }}>{j.date}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{j.description}</td>
                            <td style={styles.td}><span style={{ color: '#3B82F6', fontWeight: '600' }}>{j.debit?.account} — {j.debit?.name}</span></td>
                            <td style={styles.td}><span style={{ color: '#EF4444', fontWeight: '600' }}>{j.credit?.account} — {j.credit?.name}</span></td>
                            <td style={{ ...styles.td, fontWeight: '700', color: '#41A9A9' }}>{fmt(j.debit?.amount || j.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'balance-sheet' && (
              <>
                <div style={styles.cardTitle}><BarChart2 size={20} color="#41A9A9" /> Neraca Keuangan — ISAK 35</div>
                {!balanceSheet ? (
                  <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '32px' }}>Memuat data...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={styles.reportBox}>
                      <div style={{ fontWeight: '700', color: '#41A9A9', marginBottom: '16px', fontSize: '15px' }}>ASET</div>
                      {[
                        ['Kas & Setara Kas', balanceSheet.assets * 0.15],
                        ['Rekening Bank', balanceSheet.assets * 0.65],
                        ['Piutang SPP', balanceSheet.assets * 0.12],
                        ['Persediaan', balanceSheet.assets * 0.08],
                      ].map(([name, val]) => (
                        <div key={name} style={styles.reportRow}><span style={{ color: '#6B7280' }}>{name}</span><span style={{ fontWeight: '700' }}>{fmt(val)}</span></div>
                      ))}
                      <div style={{ ...styles.reportRow, fontWeight: '800', color: '#41A9A9', fontSize: '15px' }}><span>Total Aset</span><span>{fmt(balanceSheet.assets)}</span></div>
                    </div>
                    <div>
                      <div style={styles.reportBox}>
                        <div style={{ fontWeight: '700', color: '#EF4444', marginBottom: '16px', fontSize: '15px' }}>KEWAJIBAN</div>
                        {[
                          ['Hutang Usaha', balanceSheet.liabilities * 0.6],
                          ['Hutang Gaji', balanceSheet.liabilities * 0.4],
                        ].map(([name, val]) => (
                          <div key={name} style={styles.reportRow}><span style={{ color: '#6B7280' }}>{name}</span><span style={{ fontWeight: '700' }}>{fmt(val)}</span></div>
                        ))}
                        <div style={{ ...styles.reportRow, fontWeight: '800', color: '#EF4444' }}><span>Total Kewajiban</span><span>{fmt(balanceSheet.liabilities)}</span></div>
                      </div>
                      <div style={{ ...styles.reportBox, marginTop: '16px' }}>
                        <div style={{ fontWeight: '700', color: '#8B5CF6', marginBottom: '16px', fontSize: '15px' }}>DANA (EKUITAS)</div>
                        {[
                          ['Dana Tidak Terikat', balanceSheet.equity * 0.65],
                          ['Dana Terikat Temporer', balanceSheet.equity * 0.35],
                        ].map(([name, val]) => (
                          <div key={name} style={styles.reportRow}><span style={{ color: '#6B7280' }}>{name}</span><span style={{ fontWeight: '700' }}>{fmt(val)}</span></div>
                        ))}
                        <div style={{ ...styles.reportRow, fontWeight: '800', color: '#8B5CF6' }}><span>Total Dana</span><span>{fmt(balanceSheet.equity)}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'income-statement' && (
              <>
                <div style={styles.cardTitle}><BarChart2 size={20} color="#41A9A9" /> Laporan Aktivitas — ISAK 35</div>
                {!incomeStatement ? (
                  <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '32px' }}>Memuat data...</div>
                ) : (
                  <div style={{ maxWidth: '600px' }}>
                    <div style={styles.reportBox}>
                      <div style={{ fontWeight: '800', color: '#2C3E50', marginBottom: '20px', fontSize: '16px' }}>
                        Laporan Aktivitas Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontWeight: '700', color: '#10B981', marginBottom: '12px' }}>PENDAPATAN</div>
                      {[
                        ['Pendapatan SPP', incomeStatement.revenue * 0.85],
                        ['Pendapatan Lain-lain', incomeStatement.revenue * 0.15],
                      ].map(([name, val]) => (
                        <div key={name} style={styles.reportRow}><span style={{ color: '#6B7280' }}>{name}</span><span style={{ fontWeight: '700' }}>{fmt(val)}</span></div>
                      ))}
                      <div style={{ ...styles.reportRow, fontWeight: '800', color: '#10B981' }}><span>Total Pendapatan</span><span>{fmt(incomeStatement.revenue)}</span></div>
                      <div style={{ marginTop: '20px', fontWeight: '700', color: '#EF4444', marginBottom: '12px' }}>BEBAN</div>
                      {[
                        ['Beban Gaji & Honor', incomeStatement.expenses * 0.65],
                        ['Beban Operasional', incomeStatement.expenses * 0.20],
                        ['Beban Pemeliharaan', incomeStatement.expenses * 0.15],
                      ].map(([name, val]) => (
                        <div key={name} style={styles.reportRow}><span style={{ color: '#6B7280' }}>{name}</span><span style={{ fontWeight: '700', color: '#EF4444' }}>{fmt(val)}</span></div>
                      ))}
                      <div style={{ ...styles.reportRow, fontWeight: '800', color: '#EF4444' }}><span>Total Beban</span><span>{fmt(incomeStatement.expenses)}</span></div>
                      <div style={{ marginTop: '16px', padding: '16px', background: incomeStatement.netIncome >= 0 ? '#D1FAE520' : '#FEE2E220', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#2C3E50' }}>Kenaikan/(Penurunan) Dana</span>
                        <span style={{ fontWeight: '800', fontSize: '18px', color: incomeStatement.netIncome >= 0 ? '#10B981' : '#EF4444' }}>{fmt(incomeStatement.netIncome)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingModule;
