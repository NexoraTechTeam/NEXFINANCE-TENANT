'use client';

import { useState, useEffect, useCallback } from 'react';
import { sppService } from '@/lib/api';
import { DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, CreditCard, X, Search, Info } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const MONTHS = ['Januari 2026','Februari 2026','Maret 2026','April 2026','Mei 2026','Juni 2026','Juli 2026','Agustus 2026','September 2026','Oktober 2026','November 2026','Desember 2026'];
const CLASSES = ['7A','7B','7C','8A','8B','8C','9A','9B','9C'];

const badgeClass = (status: string) => {
  const map: Record<string, string> = {
    paid:    'badge badge-success',
    unpaid:  'badge badge-warning',
    overdue: 'badge badge-danger',
  };
  return map[status] || 'badge badge-neutral';
};

export default function SPPPage() {
  const [invoices, setInvoices]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<'create'|'pay'|null>(null);
  const [selected, setSelected]   = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState('Transfer');
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null);
  const [form, setForm]           = useState({ studentId:'', studentName:'', class:'7A', amount:'1200000', month: MONTHS[4] });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try { const r = await sppService.getInvoices(); setInvoices(r.data.invoices || []); }
    catch { setInvoices([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.studentId || !form.studentName) return showToast('Lengkapi semua field wajib.', false);
    setSubmitting(true);
    try { await sppService.createInvoice({ ...form, amount: Number(form.amount) }); await load(); setModal(null); showToast('Invoice berhasil dibuat!'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal membuat invoice.', false); }
    finally { setSubmitting(false); }
  };

  const handlePay = async () => {
    if (!selected) return;
    setSubmitting(true);
    try { await sppService.recordPayment({ invoiceId: selected.id, method: payMethod }); await load(); setModal(null); showToast(`Pembayaran ${selected.studentName} berhasil dicatat!`); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal mencatat pembayaran.', false); }
    finally { setSubmitting(false); }
  };

  const paid    = invoices.filter(i => i.status === 'paid');
  const unpaid  = invoices.filter(i => i.status === 'unpaid');
  const totalCollected = paid.reduce((s, i) => s + i.amount, 0);
  const rate    = invoices.length ? ((paid.length / invoices.length) * 100).toFixed(1) : '0';

  const filtered = invoices
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => {
      const q = search.toLowerCase();
      return !q || [i.id, i.studentName, i.class, i.month, i.status].some(v => String(v||'').toLowerCase().includes(q));
    });

  const statCards = [
    { label: 'Total Invoice',    value: invoices.length,          color: '#4373b8', icon: DollarSign,   filter: 'all'    },
    { label: 'Sudah Lunas',      value: paid.length,              color: '#10B981', icon: CheckCircle,  filter: 'paid'   },
    { label: 'Belum Bayar',      value: unpaid.length,            color: '#F59E0B', icon: Clock,        filter: 'unpaid' },
    { label: 'Collection Rate',  value: rate + '%',               color: '#6B4FA0', icon: TrendingUp,   filter: 'all'    },
    { label: 'Total Terkumpul',  value: fmtShort(totalCollected), color: '#2A4F8C', icon: DollarSign,   filter: 'paid'   },
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', width: '100%' }}>
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok
            ? <CheckCircle size={16} strokeWidth={2.5} />
            : <AlertCircle size={16} strokeWidth={2.5} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="spp-page-title" style={{ fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Manajemen SPP</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Penagihan &amp; pembayaran SPP siswa Yayasan ISAk 35</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="spp-create-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, background: '#4373b8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, transition: 'background 180ms ease, transform 180ms ease, box-shadow 180ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3461a8'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(67, 115, 184,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4373b8'; (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = ''; }}
        >
          <Plus size={17} strokeWidth={2} /> Buat Invoice
        </button>
      </div>

      {/* Stat Cards — responsive 5-card grid: auto-fill ≥150px, wraps to 2×2+1 on 375px */}
      <div className="spp-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="card card-hover anim-fadeup"
              style={{ padding: '18px 20px', borderTop: `3px solid ${s.color}`, cursor: 'pointer', animationDelay: `${i * 60}ms` }}
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
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 24 }}>
        {/* Filter & Search — filter scrolls horizontally on mobile, search full width below */}
        <div className="spp-toolbar" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="spp-filter-scroll">
            {[['all', `Semua (${invoices.length})`], ['paid', `Lunas (${paid.length})`], ['unpaid', `Belum Bayar (${unpaid.length})`]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`filter-btn${filter === val ? ' filter-btn-active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="spp-search-wrap" style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} strokeWidth={1.8} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, kelas, bulan..."
              className="form-input"
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
            <AlertCircle size={44} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.25 }} strokeWidth={1.4} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Tidak ada invoice</div>
            <div style={{ fontSize: 13 }}>Coba ubah filter atau tambah invoice baru.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID Invoice', 'Nama Siswa', 'Kelas', 'Bulan', 'Jumlah', 'Jatuh Tempo', 'Status', 'Aksi'].map(h => (
                    <th
                      key={h}
                      className={h === 'Kelas' || h === 'Jatuh Tempo' || h === 'ID Invoice' ? 'spp-col-hide' : ''}
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className="spp-table-row"
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 150ms' }}
                  >
                    <td className="spp-col-hide" style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#eef3fb', color: '#4373b8', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{inv.id}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{inv.studentName}</td>
                    <td className="spp-col-hide" style={{ padding: '14px 16px', color: 'var(--text-2)', fontSize: 14 }}>{inv.class}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-2)', fontSize: 14, whiteSpace: 'nowrap' }}>{inv.month}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#4373b8', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(inv.amount)}</td>
                    <td className="spp-col-hide" style={{ padding: '14px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtDate(inv.dueDate)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={badgeClass(inv.status)}>
                        {inv.status === 'paid'
                          ? <><CheckCircle size={12} strokeWidth={2.5} /> Lunas</>
                          : inv.status === 'overdue'
                          ? <><AlertCircle size={12} strokeWidth={2.5} /> Jatuh Tempo</>
                          : <><Clock size={12} strokeWidth={2.5} /> Belum Bayar</>}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {inv.status === 'unpaid' && (
                        <button
                          onClick={() => { setSelected(inv); setPayMethod('Transfer'); setModal('pay'); }}
                          className="spp-pay-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#10B981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36, transition: 'background 160ms ease, transform 160ms ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#059669'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#10B981'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
                        >
                          <CreditCard size={13} /> Bayar
                        </button>
                      )}
                      {inv.status === 'paid' && (
                        <span style={{ fontSize: 13, color: 'var(--text-4)' }}>{inv.paymentMethod || '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Buat Invoice */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box spp-modal" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Buat Invoice SPP</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 160ms' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}>
                <X size={20} />
              </button>
            </div>
            {/* Form grid: 2 cols on desktop, 1 col on mobile */}
            <div className="spp-form-grid" style={{ marginBottom: 20 }}>
              {[['ID Siswa', 'studentId', 'text', 'STU013'], ['Nama Siswa', 'studentName', 'text', 'Ahmad Fauzi']].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="form-label">{label} <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type={type}
                    placeholder={ph as string}
                    value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="form-input"
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Kelas</label>
                <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="form-select">
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Jumlah SPP (Rp) <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="form-input" />
              </div>
              <div className="spp-form-full">
                <label className="form-label">Bulan</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="form-select">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#eef3fb', border: '1px solid #dce6f6', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <Info size={16} color="#4373b8" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Invoice akan dibuat dengan jatuh tempo <strong>7 hari</strong> dan status <strong>Belum Bayar</strong>.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 8, background: '#4373b8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.7 : 1, transition: 'background 160ms ease' }}
              >
                <Plus size={16} /> {submitting ? 'Menyimpan...' : 'Buat Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran */}
      {modal === 'pay' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box spp-modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Catat Pembayaran</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 160ms' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
              {[['Siswa', selected.studentName], ['Kelas', selected.class], ['Bulan', selected.month], ['Jumlah', fmt(selected.amount)], ['Jatuh Tempo', fmtDate(selected.dueDate)]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: k === 'Jumlah' ? '#4373b8' : 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Metode Pembayaran</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Transfer', '🏦'], ['Tunai', '💵'], ['QRIS', '📱']].map(([m, icon]) => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 10,
                      border: `2px solid ${payMethod === m ? '#10B981' : 'var(--border)'}`,
                      background: payMethod === m ? '#f0fdf6' : '#fff',
                      color: payMethod === m ? '#10B981' : 'var(--text-3)',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', minHeight: 52,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      transition: 'border-color 160ms ease, background 160ms ease, color 160ms ease',
                      boxShadow: payMethod === m ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={handlePay}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 8, background: '#10B981', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.7 : 1, transition: 'background 160ms ease' }}
              >
                <CheckCircle size={16} /> {submitting ? 'Memproses...' : `Konfirmasi ${payMethod}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ── SPP: Page title clamp ── */
        .spp-page-title {
          font-size: clamp(20px, 5vw, 28px);
        }

        /* ── SPP: Stat grid — 5 cards, auto-fill min 150px ── */
        .spp-stat-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
        @media (max-width: 900px) {
          .spp-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 480px) {
          .spp-stat-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── SPP: Filter scroll bar ── */
        .spp-filter-scroll {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .spp-filter-scroll::-webkit-scrollbar { display: none; }

        /* ── SPP: Toolbar stacks on mobile ── */
        @media (max-width: 640px) {
          .spp-toolbar {
            flex-direction: column;
            align-items: stretch !important;
          }
          .spp-filter-scroll {
            width: 100%;
            padding-bottom: 4px;
          }
          .spp-search-wrap {
            flex: unset !important;
            min-width: unset !important;
            width: 100%;
          }
        }

        /* ── SPP: Hide less-important table columns on mobile ── */
        @media (max-width: 640px) {
          .spp-col-hide { display: none; }
        }

        /* ── SPP: Smaller action buttons in table on mobile ── */
        @media (max-width: 640px) {
          .spp-pay-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
            min-height: 30px !important;
          }
        }

        /* ── SPP: Create button full-width on very small screens ── */
        @media (max-width: 400px) {
          .spp-create-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* ── SPP: Modal — max-height + scroll on all sizes ── */
        .spp-modal {
          max-height: 90vh;
          overflow-y: auto;
        }

        /* ── SPP: Modal full-screen on 375px ── */
        @media (max-width: 430px) {
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .spp-modal {
            border-radius: 18px 18px 0 0 !important;
            max-height: 95vh;
            padding: 20px 16px 32px !important;
          }
        }

        /* ── SPP: Create form grid — 2 cols desktop, 1 col mobile ── */
        .spp-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .spp-form-full {
          grid-column: 1 / -1;
        }
        @media (max-width: 480px) {
          .spp-form-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Table row hover ── */
        .spp-table-row:hover {
          background: #eef3fb !important;
        }
      `}</style>
    </div>
  );
}
