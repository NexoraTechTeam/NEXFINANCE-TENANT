'use client';

import { useState, useEffect, useCallback } from 'react';
import { procurementService } from '@/lib/api';
import { ShoppingCart, FileText, Package, CheckCircle, Plus, X } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const statusBadge = (s: string) => {
  const map: Record<string, [string, string]> = {
    pending:   ['#F59E0B', '#fffbeb'],
    approved:  ['#10B981', '#f0fdf6'],
    rejected:  ['#EF4444', '#fff5f5'],
    ordered:   ['#3B82F6', '#eff6ff'],
    received:  ['#8B5CF6', '#f5f3ff'],
  };
  const [color, bg] = map[s] || ['#6b7280', '#f3f4f6'];
  return { color, background: bg, padding:'4px 12px', borderRadius:999, fontSize:13, fontWeight:700, display:'inline-block' };
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
      setPRs(prRes.data.prs || []); setPOs(poRes.data.pos || []);
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
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, background: toast.ok ? '#10B981' : '#EF4444', color:'#fff', padding:'13px 20px', borderRadius:10, zIndex:1000, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Pengadaan</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Purchase Request & Purchase Order</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setModal('pr')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 18px', borderRadius:9, background:'#3B82F6', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
            <Plus size={16}/> Buat PR
          </button>
          <button onClick={() => setModal('po')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 18px', borderRadius:9, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
            <Plus size={16}/> Buat PO
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total PR', value: prs.length,                              color:'#3B82F6', icon: FileText   },
          { label:'PR Pending', value: prs.filter(p=>p.status==='pending').length, color:'#F59E0B', icon: ShoppingCart },
          { label:'Total PO', value: pos.length,                              color:'#319ea9', icon: Package    },
          { label:'PO Diterima', value: pos.filter(p=>p.status==='received').length, color:'#10B981', icon: CheckCircle },
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card" style={{ padding:'18px 20px', borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid var(--border)' }}>
        {[['pr','Purchase Request (PR)'],['po','Purchase Order (PO)']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val as 'pr'|'po')} style={{ padding:'11px 22px', borderRadius:'8px 8px 0 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:'none', border:'none', borderBottom: tab===val ? '3px solid #319ea9' : '3px solid transparent', color: tab===val ? '#319ea9' : 'var(--text-3)', marginBottom:-2, minHeight:44 }}>{label}</button>
        ))}
      </div>

      <div className="card" style={{ padding:24 }}>
        {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Memuat data...</div>
        : tab === 'pr' ? (
          prs.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Belum ada Purchase Request.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f8fafc' }}>
                  {['ID','Item','Qty','Estimasi Biaya','Alasan','Status'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {prs.map((pr, i) => (
                    <tr key={pr.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px' }}><span style={{ background:'#eff6ff', color:'#3B82F6', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700 }}>{pr.id}</span></td>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{pr.item}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{pr.quantity}</td>
                      <td style={{ padding:'13px 16px', fontWeight:700, color:'#319ea9', fontSize:14 }}>{fmt(pr.estimatedCost)}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-3)', fontSize:13 }}>{pr.reason || '-'}</td>
                      <td style={{ padding:'13px 16px' }}><span style={statusBadge(pr.status)}>{pr.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        ) : (
          pos.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Belum ada Purchase Order.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f8fafc' }}>
                  {['ID PO','Vendor','Total Biaya','Status','Aksi'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {pos.map((po, i) => (
                    <tr key={po.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px' }}><span style={{ background:'#f0fafb', color:'#319ea9', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700 }}>{po.id}</span></td>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{po.vendor}</td>
                      <td style={{ padding:'13px 16px', fontWeight:700, color:'#319ea9', fontSize:14 }}>{fmt(po.totalCost)}</td>
                      <td style={{ padding:'13px 16px' }}><span style={statusBadge(po.status)}>{po.status}</span></td>
                      <td style={{ padding:'13px 16px' }}>
                        {po.status === 'ordered' && (
                          <button onClick={() => handleReceive(po.id)} style={{ padding:'7px 14px', borderRadius:7, background:'#10B981', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:36, display:'inline-flex', alignItems:'center', gap:5 }}>
                            <Package size={14}/> Terima Barang
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>

      {/* Modal PR */}
      {modal === 'pr' && (
        <div onClick={e => e.target===e.currentTarget && setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Buat Purchase Request</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              {[['Nama Item','item','text','Kertas A4'],['Estimasi Biaya (Rp)','estimatedCost','number',''],['Jumlah','quantity','number','1'],['Alasan Pengadaan','reason','text','']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>{label}</label>
                  <input type={type as string} placeholder={ph as string} value={(prForm as any)[field]} onChange={e => setPRForm({...prForm, [field]:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handlePR} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#3B82F6', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44 }}>
                {submitting ? 'Menyimpan...' : 'Buat PR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PO */}
      {modal === 'po' && (
        <div onClick={e => e.target===e.currentTarget && setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Buat Purchase Order</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              {[['ID Purchase Request (PR)','prId','text','PR001'],['Nama Vendor','vendor','text','PT. Toko ATK'],['Total Biaya (Rp)','totalCost','number','']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>{label}</label>
                  <input type={type as string} placeholder={ph as string} value={(poForm as any)[field]} onChange={e => setPOForm({...poForm, [field]:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handlePO} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44 }}>
                {submitting ? 'Menyimpan...' : 'Buat PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
