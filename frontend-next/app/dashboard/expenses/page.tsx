'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/lib/api';
import { FileText, CheckCircle, XCircle, Clock, Plus, DollarSign, X, InboxIcon } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const CATEGORIES = ['ATK & Supplies','Operasional','Pemeliharaan','Transportasi','Konsumsi','Utilitas','Lain-lain'];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending:  'badge badge-warning',
    approved: 'badge badge-success',
    rejected: 'badge badge-danger',
  };
  const labelMap: Record<string, string> = {
    pending:  'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  };
  return { className: map[s] || 'badge badge-neutral', label: labelMap[s] || s };
};

export default function ExpensesPage() {
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [modal, setModal]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null);
  const [form, setForm]           = useState({ title:'', amount:'', category: CATEGORIES[0], description:'' });

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try { const r = await expenseService.getAll(); setExpenses(r.data.expenses || []); }
    catch { setExpenses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return showToast('Lengkapi judul dan jumlah.', false);
    setSubmitting(true);
    try { await expenseService.submit({ ...form, amount: Number(form.amount) }); await load(); setModal(false); setForm({ title:'', amount:'', category: CATEGORIES[0], description:'' }); showToast('Pengeluaran berhasil diajukan!'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal mengajukan pengeluaran.', false); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id: string) => {
    try { await expenseService.approve(id); await load(); showToast('Pengeluaran disetujui.'); }
    catch { showToast('Gagal menyetujui.', false); }
  };

  const handleReject = async (id: string) => {
    try { await expenseService.reject(id); await load(); showToast('Pengeluaran ditolak.'); }
    catch { showToast('Gagal menolak.', false); }
  };

  const pending  = expenses.filter(e => e.status === 'pending');
  const approved = expenses.filter(e => e.status === 'approved');
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0);

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style jsx global>{`
        @media (max-width: 768px) {
          .filter-row { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .table-wrapper table { min-width: 600px; }
          .action-btn { padding: 6px 10px !important; font-size: 12px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .page-header { flex-direction: column !important; align-items: flex-start !important; }
          .modal-btn-row { flex-direction: column !important; }
          .modal-btn-row button { width: 100% !important; }
        }
      `}</style>

      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok ? <CheckCircle size={16}/> : <XCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Pengeluaran</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Pengajuan &amp; persetujuan pengeluaran operasional</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44, whiteSpace:'nowrap' }}>
          <Plus size={17} strokeWidth={2} /> Ajukan Pengeluaran
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid anim-fadeup" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Pengajuan', value: expenses.length,       color:'#319ea9', icon: FileText,    filter:'all'     },
          { label:'Menunggu',        value: pending.length,        color:'#F59E0B', icon: Clock,       filter:'pending' },
          { label:'Disetujui',       value: approved.length,       color:'#10B981', icon: CheckCircle, filter:'approved'},
          { label:'Total Disetujui', value: fmt(totalApproved),   color:'#3B82F6', icon: DollarSign,  filter:'approved'},
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card card-hover" style={{ padding:'18px 20px', borderTop:`4px solid ${s.color}`, cursor:'pointer' }} onClick={() => setFilter(s.filter)}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Table Card */}
      <div className="card anim-fadeup" style={{ padding:24 }}>
        {/* Filter Row */}
        <div className="filter-row" style={{ display:'flex', gap:10, marginBottom:18 }}>
          {[['all','Semua'],['pending','Menunggu'],['approved','Disetujui'],['rejected','Ditolak']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`filter-btn${filter===val ? ' filter-btn-active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-4)', fontSize:15 }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px 20px', color:'var(--text-4)' }}>
            <InboxIcon size={40} style={{ opacity:0.25, marginBottom:12 }} strokeWidth={1.2} />
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text-3)', marginBottom:4 }}>Tidak ada data</div>
            <div style={{ fontSize:13 }}>Belum ada pengeluaran dengan status ini.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Judul','Kategori','Jumlah','Tanggal','Status','Aksi'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const { className: bc, label: bl } = statusBadge(e.status);
                  return (
                    <tr key={e.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{e.title}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{e.category}</td>
                      <td style={{ padding:'13px 16px', fontWeight:700, color:'#319ea9', fontSize:14 }}>{fmt(e.amount)}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-3)', fontSize:13 }}>{e.submittedAt ? new Date(e.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding:'13px 16px' }}><span className={bc}>{bl}</span></td>
                      <td style={{ padding:'13px 16px' }}>
                        {e.status === 'pending' && (
                          <div style={{ display:'flex', gap:8 }}>
                            <button
                              onClick={() => handleApprove(e.id)}
                              className="action-btn"
                              title="Setujui"
                              style={{ padding:'7px 14px', borderRadius:7, background:'#10B981', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:36, display:'inline-flex', alignItems:'center', gap:5 }}
                            >
                              <CheckCircle size={14}/> <span>Setuju</span>
                            </button>
                            <button
                              onClick={() => handleReject(e.id)}
                              className="action-btn"
                              title="Tolak"
                              style={{ padding:'7px 14px', borderRadius:7, background:'#EF4444', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:36, display:'inline-flex', alignItems:'center', gap:5 }}
                            >
                              <XCircle size={14}/> <span>Tolak</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal-box anim-fadeup">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Ajukan Pengeluaran</div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4, borderRadius:6 }}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              {[['Judul Pengeluaran','title','text','Pembelian ATK'],['Jumlah (Rp)','amount','number','500000']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label className="form-label">{label} <span style={{ color:'#EF4444' }}>*</span></label>
                  <input
                    type={type as string}
                    placeholder={ph as string}
                    value={(form as any)[field]}
                    onChange={e => setForm({...form, [field]:e.target.value})}
                    className="form-input"
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Kategori</label>
                <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} className="form-select">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Keterangan</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description:e.target.value})}
                  rows={3}
                  className="form-input"
                  style={{ resize:'vertical' }}
                />
              </div>
            </div>
            <div className="modal-btn-row" style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding:'11px 20px', borderRadius:8, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44, display:'inline-flex', alignItems:'center', gap:7, opacity: submitting ? 0.7 : 1 }}
              >
                <Plus size={16}/> {submitting ? 'Menyimpan...' : 'Ajukan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
