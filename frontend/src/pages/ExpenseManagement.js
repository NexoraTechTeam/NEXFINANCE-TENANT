import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import { FileText, CheckCircle, XCircle, Clock, Plus, DollarSign, AlertCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const CATEGORIES = ['ATK & Supplies', 'Operasional', 'Pemeliharaan', 'Transportasi', 'Konsumsi', 'Utilitas', 'Lain-lain'];

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', label: 'Menunggu' },
  approved: { color: '#10B981', label: 'Disetujui' },
  rejected: { color: '#EF4444', label: 'Ditolak' },
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginBottom: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: (color) => ({ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', borderLeft: `4px solid ${color}` }),
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#2C3E50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  btn: (bg) => ({ background: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#F8FAFC', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#2C3E50', borderBottom: '1px solid #F3F4F6' },
  badge: (color) => ({ background: color + '20', color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }),
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '6px', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalBox: { background: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '540px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
};

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ description: '', amount: '', category: CATEGORIES[0] });

  const loadExpenses = () => {
    expenseService.getAll()
      .then(r => setExpenses(r.data.expenses || []))
      .catch(() => setExpenses([]));
  };

  useEffect(() => { loadExpenses(); }, []);

  const submit = async () => {
    if (!form.description || !form.amount) return alert('Lengkapi semua field.');
    setSubmitting(true);
    try {
      await expenseService.submit({ ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ description: '', amount: '', category: CATEGORIES[0] });
      loadExpenses();
    } catch {
      alert('Gagal submit pengeluaran. Pastikan server berjalan.');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id) => {
    try { await expenseService.approve(id); loadExpenses(); } catch { alert('Gagal approve.'); }
  };
  const reject = async (id) => {
    try { await expenseService.reject(id); loadExpenses(); } catch { alert('Gagal reject.'); }
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === 'pending').length;
  const approved = expenses.filter(e => e.status === 'approved').length;
  const approvedAmt = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + (e.amount || 0), 0);

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.title}>📋 Manajemen Pengeluaran</div>
        <div style={styles.subtitle}>Kelola pengeluaran operasional sekolah dengan alur persetujuan — Al-Musabbihin</div>

        <div style={styles.statsGrid}>
          {[
            { label: 'Total Pengajuan', value: expenses.length, icon: FileText, color: '#41A9A9' },
            { label: 'Menunggu Approval', value: pending, icon: Clock, color: '#F59E0B' },
            { label: 'Disetujui', value: approved, icon: CheckCircle, color: '#10B981' },
            { label: 'Total Disetujui', value: fmt(approvedAmt), icon: DollarSign, color: '#2C3E50' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={styles.statCard(s.color)}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50' }}>{s.value}</div>
                <Icon size={20} color={s.color} style={{ opacity: 0.4, marginTop: '8px' }} />
              </div>
            );
          })}
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={styles.cardTitle}><FileText size={20} color="#41A9A9" /> Daftar Pengeluaran</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: '6px', border: `2px solid ${filter === f ? '#41A9A9' : '#E5E7EB'}`, background: filter === f ? '#EFF6F6' : 'white', color: filter === f ? '#41A9A9' : '#6B7280', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {f === 'all' ? 'Semua' : STATUS_CONFIG[f]?.label || f}
                  </button>
                ))}
              </div>
              <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={() => setShowModal(true)}>
                <Plus size={16} /> Ajukan Pengeluaran
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: '14px' }}>
              <AlertCircle size={40} color="#E5E7EB" style={{ margin: '0 auto 12px', display: 'block' }} />
              Tidak ada pengeluaran. Klik "Ajukan Pengeluaran" untuk memulai.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>{['Deskripsi', 'Kategori', 'Jumlah', 'Pengaju', 'Tanggal', 'Status', 'Aksi'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((exp, i) => {
                    const sc = STATUS_CONFIG[exp.status] || { color: '#9CA3AF', label: exp.status };
                    return (
                      <tr key={exp.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ ...styles.td, fontWeight: '600', maxWidth: '200px' }}>{exp.description}</td>
                        <td style={styles.td}><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{exp.category}</span></td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#2C3E50' }}>{fmt(exp.amount)}</td>
                        <td style={{ ...styles.td, fontSize: '12px', color: '#6B7280' }}>{exp.submittedBy}</td>
                        <td style={{ ...styles.td, fontSize: '12px', color: '#6B7280' }}>{exp.submittedAt ? new Date(exp.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={styles.td}><span style={styles.badge(sc.color)}>{sc.label}</span></td>
                        <td style={styles.td}>
                          {exp.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => approve(exp.id)} style={{ background: '#10B98120', color: '#10B981', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Setujui
                              </button>
                              <button onClick={() => reject(exp.id)} style={{ background: '#EF444420', color: '#EF4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={14} /> Tolak
                              </button>
                            </div>
                          )}
                          {exp.status !== 'pending' && <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div style={styles.modalBox}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50', marginBottom: '8px' }}>Ajukan Pengeluaran</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Isi detail pengeluaran operasional sekolah</div>
              <div style={styles.formGrid}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={styles.label}>Deskripsi Pengeluaran</label>
                  <input style={styles.input} placeholder="Contoh: Pembelian ATK bulanan..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Jumlah (Rp)</label>
                  <input type="number" style={styles.input} placeholder="500000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Kategori</label>
                  <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button style={{ ...styles.btn('white'), color: '#6B7280', border: '1.5px solid #E5E7EB' }} onClick={() => setShowModal(false)}>Batal</button>
                <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={submit} disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Ajukan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
