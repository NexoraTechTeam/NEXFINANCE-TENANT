import React, { useState } from 'react';
import { procurementService } from '../services/api';
import { ShoppingCart, FileText, Package, CheckCircle, Plus, AlertCircle, TrendingUp } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const PR_STATUS = { pending: { color: '#F59E0B', label: 'Menunggu' }, approved: { color: '#10B981', label: 'Disetujui' }, rejected: { color: '#EF4444', label: 'Ditolak' } };
const PO_STATUS = { issued: { color: '#3B82F6', label: 'Diterbitkan' }, received: { color: '#10B981', label: 'Diterima' }, paid: { color: '#8B5CF6', label: 'Dibayar' } };

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginBottom: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: (color) => ({ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', borderLeft: `4px solid ${color}` }),
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#2C3E50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' },
  tab: (active) => ({ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: active ? '#41A9A9' : '#9CA3AF', borderBottom: active ? '3px solid #41A9A9' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.2s' }),
  btn: (bg) => ({ background: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#F8FAFC', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#2C3E50', borderBottom: '1px solid #F3F4F6' },
  badge: (color) => ({ background: color + '20', color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }),
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '6px', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalBox: { background: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '540px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
};

const ProcurementManagement = () => {
  const [tab, setTab] = useState('pr');
  const [prs, setPrs] = useState([]);
  const [pos, setPos] = useState([]);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({});

  const openModal = (type) => { setModal(type); setForm({}); };

  const submitPR = async () => {
    if (!form.description || !form.quantity || !form.estimatedCost) return alert('Lengkapi semua field.');
    setSubmitting(true);
    try {
      const res = await procurementService.createPR({ ...form, quantity: Number(form.quantity), estimatedCost: Number(form.estimatedCost) });
      setPrs(prev => [res.data, ...prev]);
      setModal(null);
    } catch { alert('Gagal buat PR. Pastikan server berjalan.'); }
    finally { setSubmitting(false); }
  };

  const submitPO = async () => {
    if (!form.prId || !form.vendor || !form.totalAmount) return alert('Lengkapi semua field.');
    setSubmitting(true);
    try {
      const res = await procurementService.createPO({ ...form, totalAmount: Number(form.totalAmount) });
      setPos(prev => [res.data, ...prev]);
      setModal(null);
    } catch { alert('Gagal buat PO. Pastikan server berjalan.'); }
    finally { setSubmitting(false); }
  };

  const receivePO = async (id) => {
    try {
      await procurementService.receivePO(id);
      setPos(prev => prev.map(p => p.id === id ? { ...p, status: 'received' } : p));
    } catch { alert('Gagal update PO.'); }
  };

  const totalPR = prs.length;
  const totalPO = pos.length;
  const totalSpend = pos.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const pendingPR = prs.filter(p => p.status === 'pending').length;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.title}>🛒 Manajemen Pengadaan</div>
        <div style={styles.subtitle}>Purchase Request → Purchase Order → Penerimaan Barang — Al-Musabbihin</div>

        <div style={styles.statsGrid}>
          {[
            { label: 'Total PR', value: totalPR, icon: FileText, color: '#41A9A9' },
            { label: 'PR Menunggu', value: pendingPR, icon: AlertCircle, color: '#F59E0B' },
            { label: 'Total PO', value: totalPO, icon: Package, color: '#3B82F6' },
            { label: 'Total Pengadaan', value: fmt(totalSpend), icon: TrendingUp, color: '#10B981' },
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
          <div style={styles.tabs}>
            <button style={styles.tab(tab === 'pr')} onClick={() => setTab('pr')}>Purchase Request (PR)</button>
            <button style={styles.tab(tab === 'po')} onClick={() => setTab('po')}>Purchase Order (PO)</button>
          </div>

          {tab === 'pr' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.cardTitle}><FileText size={20} color="#41A9A9" /> Daftar Purchase Request</div>
                <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={() => openModal('pr')}>
                  <Plus size={16} /> Buat PR
                </button>
              </div>
              {prs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: '14px' }}>
                  <ShoppingCart size={40} color="#E5E7EB" style={{ margin: '0 auto 12px', display: 'block' }} />
                  Belum ada Purchase Request. Klik "Buat PR" untuk memulai.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead><tr>{['ID PR', 'Deskripsi', 'Qty', 'Est. Biaya', 'Urgensi', 'Status'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {prs.map((pr, i) => {
                        const sc = PR_STATUS[pr.status] || { color: '#9CA3AF', label: pr.status };
                        return (
                          <tr key={pr.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={styles.td}><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{pr.id}</span></td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{pr.description}</td>
                            <td style={styles.td}>{pr.quantity}</td>
                            <td style={styles.td}>{fmt(pr.estimatedCost)}</td>
                            <td style={styles.td}><span style={{ background: pr.urgency === 'urgent' ? '#FEF3C7' : '#F3F4F6', color: pr.urgency === 'urgent' ? '#D97706' : '#6B7280', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{pr.urgency}</span></td>
                            <td style={styles.td}><span style={styles.badge(sc.color)}>{sc.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'po' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.cardTitle}><Package size={20} color="#41A9A9" /> Daftar Purchase Order</div>
                <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={() => openModal('po')}>
                  <Plus size={16} /> Buat PO
                </button>
              </div>
              {pos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: '14px' }}>
                  <Package size={40} color="#E5E7EB" style={{ margin: '0 auto 12px', display: 'block' }} />
                  Belum ada Purchase Order.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead><tr>{['ID PO', 'Ref PR', 'Vendor', 'Total', 'Status', 'Aksi'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {pos.map((po, i) => {
                        const sc = PO_STATUS[po.status] || { color: '#9CA3AF', label: po.status };
                        return (
                          <tr key={po.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={styles.td}><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{po.id}</span></td>
                            <td style={styles.td}>{po.prId}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{po.vendor}</td>
                            <td style={styles.td}>{fmt(po.totalAmount)}</td>
                            <td style={styles.td}><span style={styles.badge(sc.color)}>{sc.label}</span></td>
                            <td style={styles.td}>
                              {po.status === 'issued' && (
                                <button onClick={() => receivePO(po.id)} style={{ background: '#10B98120', color: '#10B981', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle size={14} /> Terima Barang
                                </button>
                              )}
                              {po.status !== 'issued' && <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {modal === 'pr' && (
          <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div style={styles.modalBox}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50', marginBottom: '20px' }}>Buat Purchase Request</div>
              <div style={styles.formGrid}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={styles.label}>Deskripsi Kebutuhan</label>
                  <input style={styles.input} placeholder="Contoh: Pembelian meja belajar..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Jumlah Unit</label>
                  <input type="number" style={styles.input} placeholder="10" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Estimasi Biaya (Rp)</label>
                  <input type="number" style={styles.input} placeholder="5000000" value={form.estimatedCost || ''} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Urgensi</label>
                  <select style={styles.input} value={form.urgency || 'normal'} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button style={{ background: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => setModal(null)}>Batal</button>
                <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={submitPR} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Buat PR'}</button>
              </div>
            </div>
          </div>
        )}

        {modal === 'po' && (
          <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div style={styles.modalBox}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50', marginBottom: '20px' }}>Buat Purchase Order</div>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Referensi PR</label>
                  <input style={styles.input} placeholder="PR123456..." value={form.prId || ''} onChange={e => setForm({ ...form, prId: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Nama Vendor</label>
                  <input style={styles.input} placeholder="CV Sejahtera..." value={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Total Nilai PO (Rp)</label>
                  <input type="number" style={styles.input} placeholder="5000000" value={form.totalAmount || ''} onChange={e => setForm({ ...form, totalAmount: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button style={{ background: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => setModal(null)}>Batal</button>
                <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={submitPO} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Buat PO'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementManagement;
