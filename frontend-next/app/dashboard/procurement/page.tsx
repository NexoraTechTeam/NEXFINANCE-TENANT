'use client';

import { useState, useEffect, useCallback } from 'react';
import { procurementService } from '@/lib/api';
import { canReceivePO, poStatusKey, posFrom, prsFrom } from '@/lib/procurement';
import { ShoppingCart, FileText, Package, CheckCircle, CheckCircle as CheckCircleIcon, Plus, X, InboxIcon, XCircle } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const statusBadge = (status: string): { className: string; style?: Record<string, string>; label: string } => {
  const s = poStatusKey(status);
  const labelMap: Record<string, string> = {
    pending:  'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    ordered:  'Ordered',
    received: 'Received',
  };
  if (s === 'pending')  return { className: 'badge badge-warning', label: labelMap[s] };
  if (s === 'approved') return { className: 'badge badge-success', label: labelMap[s] };
  if (s === 'rejected') return { className: 'badge badge-danger',  label: labelMap[s] };
  if (s === 'ordered')  return { className: 'badge badge-info',    label: labelMap[s] };
  if (s === 'received') return { className: 'badge', style: { color:'var(--nx-purple)', background:'var(--nx-purple-50)' }, label: labelMap[s] };
  return { className: 'badge badge-neutral', label: s };
};

export default function ProcurementPage() {
  const [prs, setPRs]             = useState<any[]>([]);
  const [pos, setPOs]             = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'pr'|'po'>('pr');
  const [modal, setModal]         = useState<'pr'|'po'|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null);
  const [prForm, setPRForm]       = useState({ item:'', quantity:'1', estimatedCost:'', reason:'' });
  const [poForm, setPOForm]       = useState({ prId:'', vendor:'', totalCost:'' });

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try {
      const [prRes, poRes] = await Promise.all([procurementService.getPRs(), procurementService.getPOs()]);
      setPRs(prsFrom(prRes.data)); setPOs(posFrom(poRes.data));
    } catch { setPRs([]); setPOs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePR = async () => {
    if (!prForm.item || !prForm.estimatedCost) return showToast('Lengkapi item dan estimasi biaya.', false);
    setSubmitting(true);
    try { await procurementService.createPR({ ...prForm, quantity: Number(prForm.quantity), estimatedCost: Number(prForm.estimatedCost) }); await load(); setModal(null); setPRForm({ item:'', quantity:'1', estimatedCost:'', reason:'' }); showToast('Purchase Request berhasil dibuat!'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal membuat PR.', false); }
    finally { setSubmitting(false); }
  };

  const handlePO = async () => {
    if (!poForm.vendor || !poForm.totalCost) return showToast('Lengkapi vendor dan total biaya.', false);
    setSubmitting(true);
    try { await procurementService.createPO({ ...poForm, totalCost: Number(poForm.totalCost) }); await load(); setModal(null); setPOForm({ prId:'', vendor:'', totalCost:'' }); showToast('Purchase Order berhasil dibuat!'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal membuat PO.', false); }
    finally { setSubmitting(false); }
  };

  const handleReceive = async (id: string) => {
    try { await procurementService.receivePO(id); await load(); showToast('Barang berhasil diterima!'); }
    catch { showToast('Gagal konfirmasi penerimaan.', false); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style jsx global>{`
        /* ── Procurement page responsive ── */
        @media (max-width: 768px) {
          .proc-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .proc-header-actions {
            width: 100% !important;
            flex-direction: column !important;
          }
          .proc-header-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
          .proc-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .proc-tab-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            white-space: nowrap !important;
            padding-bottom: 2px !important;
            scrollbar-width: none;
          }
          .proc-tab-bar::-webkit-scrollbar { display: none; }
          .proc-table-wrapper table {
            min-width: 580px !important;
          }
          .proc-modal-btn-row {
            flex-direction: column !important;
          }
          .proc-modal-btn-row button {
            width: 100% !important;
            justify-content: center !important;
          }
          .action-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .proc-stat-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Section header (shared) ── */
        .isak35-section-header {
          border-left: 3px solid var(--brand-500);
          padding-left: 12px;
        }

        /* ── Procurement table wrapper ── */
        .proc-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }

        /* ── Action button hover ── */
        .proc-action-btn {
          transition: opacity 160ms, transform 160ms;
          cursor: pointer;
        }
        .proc-action-btn:hover:not(:disabled) {
          opacity: 0.85;
          transform: translateY(-1px);
        }
      `}</style>

      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok ? <CheckCircleIcon size={16}/> : <XCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header proc-page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Pengadaan</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Purchase Request &amp; Purchase Order</p>
        </div>
        <div className="proc-header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setModal('pr')}
            className="proc-action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 9, background: 'var(--nx-purple)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' }}
          >
            <Plus size={16}/> Buat PR
          </button>
          <button
            onClick={() => setModal('po')}
            className="proc-action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 9, background: 'var(--brand-500)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' }}
          >
            <Plus size={16}/> Buat PO
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        className="proc-stat-grid anim-fadeup"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}
      >
        {[
          { label: 'Total PR',    value: prs.length,                                   color: 'var(--nx-purple)', icon: FileText    },
          { label: 'PR Pending',  value: prs.filter(p=>p.status==='pending').length,   color: '#F59E0B', icon: ShoppingCart },
          { label: 'Total PO',    value: pos.length,                                   color: 'var(--brand-500)', icon: Package     },
          { label: 'PO Diterima', value: pos.filter(p=>p.status==='received').length,  color: '#10B981', icon: CheckCircle },
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card" style={{ padding: '18px 20px', borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity: 0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div
        className="tab-bar proc-tab-bar"
        style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 20 }}
      >
        {([['pr','Purchase Request (PR)', FileText],['po','Purchase Order (PO)', Package]] as const).map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`tab-btn${tab===val ? ' tab-btn-active' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card anim-fadeup" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-4)', fontSize: 15 }}>Memuat data...</div>
        ) : tab === 'pr' ? (
          prs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <InboxIcon size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} strokeWidth={1.2} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Tidak ada Purchase Request</div>
              <div style={{ fontSize: 13 }}>Klik &ldquo;Buat PR&rdquo; untuk membuat permintaan baru.</div>
              <button
                onClick={() => setModal('pr')}
                className="proc-action-btn"
                style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, background: 'var(--nx-purple)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={15}/> Buat PR
              </button>
            </div>
          ) : (
            <>
              <div
                className="isak35-section-header"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}
              >
                Daftar Purchase Request
              </div>
              <div className="proc-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['ID','Item','Qty','Estimasi Biaya','Alasan','Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prs.map((pr, i) => (
                      <tr key={pr.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0 ? '#fff' : '#fafbfc', transition: 'background 120ms' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: 'var(--brand-50)', color: 'var(--brand-500)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{pr.id}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{pr.item || pr.description}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-2)', fontSize: 14 }}>{pr.quantity}</td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--brand-500)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(pr.estimatedCost)}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-3)', fontSize: 13 }}>{pr.reason || '-'}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {(() => { const b = statusBadge(pr.status); return <span className={b.className} style={b.style}>{b.label}</span>; })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          pos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <InboxIcon size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} strokeWidth={1.2} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Tidak ada Purchase Order</div>
              <div style={{ fontSize: 13 }}>Klik &ldquo;Buat PO&rdquo; untuk membuat order baru.</div>
              <button
                onClick={() => setModal('po')}
                className="proc-action-btn"
                style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, background: 'var(--brand-500)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={15}/> Buat PO
              </button>
            </div>
          ) : (
            <>
              <div
                className="isak35-section-header"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}
              >
                Daftar Purchase Order
              </div>
              <div className="proc-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['ID PO','Vendor','Total Biaya','Status','Aksi'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((po, i) => (
                      <tr key={po.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0 ? '#fff' : '#fafbfc', transition: 'background 120ms' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: 'var(--brand-50)', color: 'var(--brand-500)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{po.id}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{po.vendor}</td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--brand-500)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(po.totalAmount ?? po.totalCost)}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {(() => { const b = statusBadge(po.status); return <span className={b.className} style={b.style}>{b.label}</span>; })()}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          {canReceivePO(po.status) && (
                            <button
                              onClick={() => handleReceive(po.id)}
                              className="action-btn proc-action-btn"
                              style={{ padding: '7px 14px', borderRadius: 7, background: '#10B981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <Package size={14}/> Terima Barang
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>

      {/* Modal PR */}
      {modal === 'pr' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal-box anim-fadeup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div
                className="isak35-section-header"
                style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}
              >
                Buat Purchase Request
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 6 }}><X size={22}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                ['Nama Item', 'item', 'text', 'Kertas A4'],
                ['Estimasi Biaya (Rp)', 'estimatedCost', 'number', ''],
                ['Jumlah', 'quantity', 'number', '1'],
                ['Alasan Pengadaan', 'reason', 'text', ''],
              ].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type as string}
                    placeholder={ph as string}
                    value={(prForm as any)[field]}
                    onChange={e => setPRForm({...prForm, [field]: e.target.value})}
                    className="form-input"
                  />
                </div>
              ))}
            </div>
            <div className="proc-modal-btn-row" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={handlePR}
                disabled={submitting}
                className="proc-action-btn"
                style={{ padding: '11px 20px', borderRadius: 8, background: 'var(--nx-purple)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Menyimpan...' : 'Buat PR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PO */}
      {modal === 'po' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal-box anim-fadeup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div
                className="isak35-section-header"
                style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}
              >
                Buat Purchase Order
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 6 }}><X size={22}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                ['ID Purchase Request (PR)', 'prId', 'text', 'PR001'],
                ['Nama Vendor', 'vendor', 'text', 'PT. Toko ATK'],
                ['Total Biaya (Rp)', 'totalCost', 'number', ''],
              ].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type as string}
                    placeholder={ph as string}
                    value={(poForm as any)[field]}
                    onChange={e => setPOForm({...poForm, [field]: e.target.value})}
                    className="form-input"
                  />
                </div>
              ))}
            </div>
            <div className="proc-modal-btn-row" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={handlePO}
                disabled={submitting}
                className="proc-action-btn"
                style={{ padding: '11px 20px', borderRadius: 8, background: 'var(--brand-500)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Menyimpan...' : 'Buat PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
