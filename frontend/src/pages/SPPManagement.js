import React, { useEffect, useState, useCallback } from 'react';
import { sppService } from '../services/api';
import { DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, CreditCard, X, Printer, Search, ArrowUpDown } from 'lucide-react';
import { exportReceiptPDF } from '../utils/exportPDF';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => `Rp ${(n / 1000000).toFixed(1)}M`;
const fmtDateTime = (v) => {
  if (!v) return '-';
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return v;
  return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const S = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  sub: { fontSize: '14px', color: '#9CA3AF', marginBottom: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: (c) => ({ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', borderLeft: `4px solid ${c}` }),
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' },
  badge: (s) => {
    const map = { paid: ['#10B981', '#D1FAE5'], unpaid: ['#F59E0B', '#FEF3C7'], overdue: ['#EF4444', '#FEE2E2'] };
    const [c, bg] = map[s] || ['#9CA3AF', '#F3F4F6'];
    return { background: bg, color: c, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' };
  },
  btn: (bg, color = 'white') => ({ background: bg, color, border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }),
  filterBtn: (active) => ({ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${active ? '#41A9A9' : '#E5E7EB'}`, background: active ? '#EFF6F6' : 'white', color: active ? '#41A9A9' : '#6B7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }),
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '6px', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' },
  modalBox: { background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};

const MONTHS = ['Januari 2026','Februari 2026','Maret 2026','April 2026','Mei 2026','Juni 2026','Juli 2026','Agustus 2026','September 2026','Oktober 2026','November 2026','Desember 2026'];
const CLASSES = ['7A','7B','7C','8A','8B','8C','9A','9B','9C'];

const SPPManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'create' | 'pay' | null
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ studentId: '', studentName: '', class: '7A', amount: '1200000', month: MONTHS[4] });
  const [payMethod, setPayMethod] = useState('Transfer');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    try {
      const res = await sppService.getInvoices();
      setInvoices(res.data.invoices || []);
      setError('');
    } catch (e) {
      setInvoices([]);
      setError(e.response?.data?.error || 'Gagal memuat data invoice SPP.');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!form.studentId || !form.studentName || !form.amount) return showToast('Lengkapi semua field wajib.', false);
    setSubmitting(true);
    try {
      await sppService.createInvoice({ ...form, amount: Number(form.amount) });
      await load();
      setModal(null);
      setForm({ studentId: '', studentName: '', class: '7A', amount: '1200000', month: MONTHS[4] });
      showToast('Invoice berhasil dibuat!');
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal membuat invoice.', false);
    } finally { setSubmitting(false); }
  };

  const handlePay = async () => {
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      await sppService.recordPayment({ invoiceId: selectedInvoice.id, method: payMethod });
      await load();
      setModal(null);
      setSelectedInvoice(null);
      showToast(`Pembayaran ${selectedInvoice.studentName} berhasil dicatat!`);
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal mencatat pembayaran.', false);
    } finally { setSubmitting(false); }
  };

  const openPay = (inv) => { setSelectedInvoice(inv); setPayMethod('Transfer'); setModal('pay'); };

  const paid = invoices.filter(i => i.status === 'paid');
  const unpaid = invoices.filter(i => i.status === 'unpaid');
  const totalCollected = paid.reduce((s, i) => s + i.amount, 0);
  const rate = invoices.length > 0 ? ((paid.length / invoices.length) * 100).toFixed(1) : '0';

  const filtered = (filter === 'all' ? invoices : invoices.filter((i) => i.status === filter))
    .filter((i) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return [
        i.id, i.studentName, i.class, i.month, i.paymentMethod, i.status,
      ].some((v) => String(v || '').toLowerCase().includes(q));
    });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (sortKey === 'amount') return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    const sa = String(va || '').toLowerCase();
    const sb = String(vb || '').toLowerCase();
    if (sa < sb) return sortDir === 'asc' ? -1 : 1;
    if (sa > sb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  if (loading) return <div style={{ ...S.container, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#9CA3AF' }}>⏳ Memuat data SPP...</div>;

  return (
    <div style={S.container}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: toast.ok ? '#10B981' : '#EF4444', color: 'white', padding: '14px 20px', borderRadius: '10px', zIndex: 1000, fontSize: '14px', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div style={S.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={S.title}>💰 Manajemen SPP</div>
            <div style={S.sub}>Penagihan & Pembayaran SPP Siswa — Yayasan ISAk 35</div>
          </div>
          <button style={S.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={() => setModal('create')}>
            <Plus size={16} /> Buat Invoice
          </button>
        </div>
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 13, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        {/* Stats */}
        <div style={S.statsGrid}>
          {[
            { label: 'Total Invoice', value: invoices.length, color: '#41A9A9', icon: DollarSign, toFilter: 'all' },
            { label: 'Sudah Lunas', value: paid.length, color: '#10B981', icon: CheckCircle, toFilter: 'paid' },
            { label: 'Belum Bayar', value: unpaid.length, color: '#F59E0B', icon: Clock, toFilter: 'unpaid' },
            { label: 'Collection Rate', value: rate + '%', color: '#3B82F6', icon: TrendingUp, toFilter: 'all' },
            { label: 'Total Terkumpul', value: fmtShort(totalCollected), color: '#8B5CF6', icon: DollarSign, toFilter: 'paid' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ ...S.statCard(s.color), cursor: 'pointer' }} onClick={() => setFilter(s.toFilter)}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50', marginBottom: '6px' }}>{s.value}</div>
                <Icon size={18} color={s.color} style={{ opacity: 0.5 }} />
              </div>
            );
          })}
        </div>

        {/* Filter + Table */}
        <div style={S.card}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[['all', `Semua (${invoices.length})`], ['paid', `Lunas (${paid.length})`], ['unpaid', `Belum Bayar (${unpaid.length})`]].map(([val, label]) => (
              <button key={val} style={S.filterBtn(filter === val)} onClick={() => { setFilter(val); setPage(1); }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                className="input"
                style={{ paddingLeft: 34 }}
                placeholder="Cari invoice, nama siswa, kelas, bulan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="input" style={{ flex: '0 0 140px' }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}/halaman</option>)}
            </select>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              Tidak ada invoice.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('id')}>ID Invoice <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('studentName')}>Nama Siswa <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('class')}>Kelas <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('month')}>Bulan <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('amount')}>Jumlah <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('dueDate')}>Jatuh Tempo <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((inv) => (
                    <tr key={inv.id}>
                      <td><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>{inv.id}</span></td>
                      <td style={{ fontWeight: '600' }}>{inv.studentName}</td>
                      <td>{inv.class}</td>
                      <td>{inv.month}</td>
                      <td style={{ fontWeight: '700', color: '#41A9A9' }}>{fmt(inv.amount)}</td>
                      <td style={{ fontSize: '12px', color: '#6B7280' }}>{inv.dueDate}</td>
                      <td>
                        <span style={S.badge(inv.status)}>
                          {inv.status === 'paid' ? <><CheckCircle size={12} /> Lunas</> : <><Clock size={12} /> Belum Bayar</>}
                        </span>
                        {inv.status === 'paid' && inv.paymentMethod && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>{inv.paymentMethod} · {fmtDateTime(inv.paidAt)}</div>}
                      </td>
                      <td>
                        {inv.status === 'unpaid' && (
                          <button onClick={() => openPay(inv)} style={S.btn('#10B981')}>
                            <CreditCard size={14} /> Bayar
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <button onClick={() => exportReceiptPDF(inv)} style={S.btn('white', '#41A9A9')}>
                            <Printer size={14} /> Bukti
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Menampilkan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sorted.length)} dari {sorted.length} data
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</button>
                  <button className="btn btn-sm btn-ghost" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Buat Invoice */}
      {modal === 'create' && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50' }}>Buat Invoice SPP</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={22} /></button>
            </div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>ID Siswa <span style={{ color: '#EF4444' }}>*</span></label>
                <input style={S.input} placeholder="STU013" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Nama Siswa <span style={{ color: '#EF4444' }}>*</span></label>
                <input style={S.input} placeholder="Ahmad Fauzi" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Kelas</label>
                <select style={S.input} value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Jumlah SPP (Rp) <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="number" style={S.input} placeholder="1200000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Bulan</label>
                <select style={S.input} value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: '#EFF6F6', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#2C3E50' }}>
              📋 Invoice akan dibuat dengan jatuh tempo <strong>7 hari</strong> dari sekarang dan status <strong>Belum Bayar</strong>.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={S.btn('white', '#6B7280')} onClick={() => setModal(null)}>Batal</button>
              <button style={S.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={handleCreate} disabled={submitting}>
                <Plus size={16} /> {submitting ? 'Menyimpan...' : 'Buat Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran */}
      {modal === 'pay' && selectedInvoice && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50' }}>Catat Pembayaran</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={22} /></button>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              {[['Siswa', selectedInvoice.studentName], ['Kelas', selectedInvoice.class], ['Bulan', selectedInvoice.month], ['Jumlah', fmt(selectedInvoice.amount)], ['Jatuh Tempo', selectedInvoice.dueDate]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>
                  <span style={{ color: '#6B7280' }}>{k}</span>
                  <span style={{ fontWeight: '700', color: '#2C3E50' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={S.label}>Metode Pembayaran</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['Transfer', 'Tunai', 'QRIS'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${payMethod === m ? '#10B981' : '#E5E7EB'}`, background: payMethod === m ? '#D1FAE5' : 'white', color: payMethod === m ? '#10B981' : '#6B7280', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                    {m === 'Transfer' ? '🏦' : m === 'Tunai' ? '💵' : '📱'} {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={S.btn('white', '#6B7280')} onClick={() => setModal(null)}>Batal</button>
              <button style={S.btn('#10B981')} onClick={handlePay} disabled={submitting}>
                <CheckCircle size={16} /> {submitting ? 'Memproses...' : `Konfirmasi ${payMethod}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SPPManagement;
