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
        /* ── Expenses: page title clamp ── */
        .exp-page-title {
          font-size: clamp(20px, 5vw, 28px);
        }

        /* ── Expenses: stat grid — 4 cards, auto-fill min 160px, 2-col on small mobile ── */
        .exp-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 400px) {
          .exp-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Expenses: filter row — horizontal scroll on mobile ── */
        .exp-filter-row {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          white-space: nowrap;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .exp-filter-row::-webkit-scrollbar { display: none; }
        .exp-filter-row .filter-btn {
          flex-shrink: 0;
          cursor: pointer;
        }

        /* ── Expenses: table min-width for horizontal scroll ── */
        .exp-table-wrap table {
          min-width: 560px;
        }

        /* ── Expenses: action button smaller on mobile ── */
        @media (max-width: 640px) {
          .exp-action-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
            min-height: 30px !important;
          }
          .exp-action-btn span { display: none; }
        }

        /* ── Expenses: page header stacks on mobile ── */
        @media (max-width: 540px) {
          .exp-header-btn {
            width: 100%;
            justify-content: center !important;
          }
        }

        /* ── Expenses: modal full-screen bottom sheet on 430px ── */
        @media (max-width: 430px) {
          .exp-modal-box {
            border-radius: 18px 18px 0 0 !important;
            max-height: 95vh;
            padding: 20px 16px 32px !important;
          }
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
        }

        /* ── Expenses: modal max-height + scroll ── */
        .exp-modal-box {
          max-height: 90vh;
          overflow-y: auto;
        }

        /* ── Expenses: modal button row stacks on mobile ── */
        @media (max-width: 480px) {
          .exp-modal-btn-row {
            flex-direction: column !important;
          }
          .exp-modal-btn-row button {
            width: 100% !important;
            justify-content: center !important;
          }
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
          <h1 className="exp-page-title" style={{ fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Pengeluaran</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Pengajuan &amp; persetujuan pengeluaran operasional</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="exp-header-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, background: '#4373b8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap', transition: 'background 180ms ease, transform 180ms ease, box-shadow 180ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3461a8'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(67, 115, 184,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4373b8'; (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = ''; }}
        >
          <Plus size={17} strokeWidth={2} /> Ajukan Pengeluaran
        </button>
      </div>

      {/* Stat Cards — responsive auto-fill grid */}
      <div className="exp-stat-grid anim-fadeup">
        {[
          { label: 'Total Pengajuan', value: expenses.length,     color: '#4373b8', icon: FileText,    filter: 'all'      },
          { label: 'Menunggu',        value: pending.length,      color: '#F59E0B', icon: Clock,       filter: 'pending'  },
          { label: 'Disetujui',       value: approved.length,     color: '#10B981', icon: CheckCircle, filter: 'approved' },
          { label: 'Total Disetujui', value: fmt(totalApproved),  color: '#6B4FA0', icon: DollarSign,  filter: 'approved' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="card card-hover"
              style={{ padding: '18px 20px', borderTop: `4px solid ${s.color}`, cursor: 'pointer', animationDelay: `${i * 60}ms` }}
              onClick={() => setFilter(s.filter)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${s.color}15, ${s.color}25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card anim-fadeup" style={{ padding: 24 }}>
        {/* Filter Row — horizontal scroll on mobile */}
        <div className="exp-filter-row">
          {[['all','Semua'],['pending','Menunggu'],['approved','Disetujui'],['rejected','Ditolak']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`filter-btn${filter === val ? ' filter-btn-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
            <InboxIcon size={44} style={{ opacity: 0.2, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} strokeWidth={1.2} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Tidak ada data</div>
            <div style={{ fontSize: 13 }}>Belum ada pengeluaran dengan status ini.</div>
          </div>
        ) : (
          <div className="table-wrapper exp-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Judul','Kategori','Jumlah','Tanggal','Status','Aksi'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const { className: bc, label: bl } = statusBadge(e.status);
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 150ms' }}
                      className="exp-table-row"
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{e.title}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-2)', fontSize: 14 }}>{e.category}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#4373b8', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(e.amount)}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{e.submittedAt ? new Date(e.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding: '13px 16px' }}><span className={bc}>{bl}</span></td>
                      <td style={{ padding: '13px 16px' }}>
                        {e.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleApprove(e.id)}
                              className="exp-action-btn"
                              title="Setujui"
                              style={{ padding: '7px 14px', borderRadius: 7, background: '#10B981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'background 160ms ease, transform 160ms ease' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#059669'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#10B981'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
                            >
                              <CheckCircle size={14}/> <span>Setuju</span>
                            </button>
                            <button
                              onClick={() => handleReject(e.id)}
                              className="exp-action-btn"
                              title="Tolak"
                              style={{ padding: '7px 14px', borderRadius: 7, background: '#EF4444', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'background 160ms ease, transform 160ms ease' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
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

      {/* Modal: Ajukan Pengeluaran */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box exp-modal-box anim-fadeup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Ajukan Pengeluaran</div>
              <button
                onClick={() => setModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 160ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
              >
                <X size={22}/>
              </button>
            </div>
            {/* Form fields — stacked (flex column) on all breakpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[['Judul Pengeluaran','title','text','Pembelian ATK'],['Jumlah (Rp)','amount','number','500000']].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="form-label">{label} <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type={type as string}
                    placeholder={ph as string}
                    value={(form as any)[field]}
                    onChange={e => setForm({...form, [field]: e.target.value})}
                    className="form-input"
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Kategori</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-select">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Keterangan</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="exp-modal-btn-row" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: '11px 20px', borderRadius: 8, background: '#4373b8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 7, opacity: submitting ? 0.7 : 1, transition: 'background 160ms ease' }}
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
