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
    { label: 'Total Invoice',    value: invoices.length,          color: '#319ea9', icon: DollarSign,   filter: 'all'    },
    { label: 'Sudah Lunas',      value: paid.length,              color: '#10B981', icon: CheckCircle,  filter: 'paid'   },
    { label: 'Belum Bayar',      value: unpaid.length,            color: '#F59E0B', icon: Clock,        filter: 'unpaid' },
    { label: 'Collection Rate',  value: rate + '%',               color: '#3B82F6', icon: TrendingUp,   filter: 'all'    },
    { label: 'Total Terkumpul',  value: fmtShort(totalCollected), color: '#8B5CF6', icon: DollarSign,   filter: 'paid'   },
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Manajemen SPP</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Penagihan &amp; pembayaran SPP siswa Al-Musabbihin</p>
        </div>
        <button
          onClick={() => setModal('create')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, background: '#319ea9', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, transition: 'background 180ms ease, transform 180ms ease, box-shadow 180ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#278a94'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(49,158,169,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#319ea9'; (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = ''; }}
        >
          <Plus size={17} strokeWidth={2} /> Buat Invoice
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
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
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 24 }}>
        {/* Filter & Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="spp-filter-scroll">
            {[['all', `Semua (${invoices.length})`], ['paid', `Lunas (${paid.length})`], ['unpaid', `Belum Bayar (${unpaid.length})`]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`filter-btn${filter === val ? ' filter-btn-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
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
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-4)' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 15 }}>Tidak ada invoice.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID Invoice', 'Nama Siswa', 'Kelas', 'Bulan', 'Jumlah', 'Jatuh Tempo', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
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
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#f0fafb', color: '#319ea9', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{inv.id}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{inv.studentName}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-2)', fontSize: 14 }}>{inv.class}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-2)', fontSize: 14, whiteSpace: 'nowrap' }}>{inv.month}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#319ea9', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(inv.amount)}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtDate(inv.dueDate)}</td>
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
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Buat Invoice SPP</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'background 160ms' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
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
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Bulan</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="form-select">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f0fafb', border: '1px solid #d5f0f3', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <Info size={16} color="#319ea9" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Invoice akan dibuat dengan jatuh tempo <strong>7 hari</strong> dan status <strong>Belum Bayar</strong>.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 8, background: '#319ea9', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.7 : 1, transition: 'background 160ms ease' }}
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
          <div className="modal-box" style={{ maxWidth: 480 }}>
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
                  <span style={{ fontWeight: 700, color: k === 'Jumlah' ? '#319ea9' : 'var(--text)' }}>{v}</span>
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
        /* Mobile: scrollable filter buttons */
        .spp-filter-scroll {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .spp-filter-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            scrollbar-width: none;
          }
          .spp-filter-scroll::-webkit-scrollbar { display: none; }

          /* Modal max-height scroll on small screens */
          .modal-box {
            max-height: 90vh;
            overflow-y: auto;
          }

          /* Smaller action buttons in table on mobile */
          .spp-pay-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
            min-height: 30px !important;
          }

          /* Stack filter + search vertically */
          .spp-filter-scroll {
            width: 100%;
          }
        }

        /* Table row hover */
        .spp-table-row:hover {
          background: #f0fafb !important;
        }
      `}</style>
    </div>
  );
}
