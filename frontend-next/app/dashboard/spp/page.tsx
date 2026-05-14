'use client';

import { useState, useEffect, useCallback } from 'react';
import { sppService } from '@/lib/api';
import { DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Plus, CreditCard, X, Search } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const MONTHS = ['Januari 2026','Februari 2026','Maret 2026','April 2026','Mei 2026','Juni 2026','Juli 2026','Agustus 2026','September 2026','Oktober 2026','November 2026','Desember 2026'];
const CLASSES = ['7A','7B','7C','8A','8B','8C','9A','9B','9C'];

const badge = (status: string) => {
  const map: Record<string, [string, string]> = {
    paid:    ['#10B981','#f0fdf6'],
    unpaid:  ['#F59E0B','#fffbeb'],
    overdue: ['#EF4444','#fff5f5'],
  };
  const [color, bg] = map[status] || ['#6b7280','#f3f4f6'];
  return { color, background: bg, padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 };
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
    { label: 'Total Invoice',    value: invoices.length,       color: '#319ea9', icon: DollarSign,   filter: 'all'    },
    { label: 'Sudah Lunas',      value: paid.length,           color: '#10B981', icon: CheckCircle,  filter: 'paid'   },
    { label: 'Belum Bayar',      value: unpaid.length,         color: '#F59E0B', icon: Clock,        filter: 'unpaid' },
    { label: 'Collection Rate',  value: rate + '%',            color: '#3B82F6', icon: TrendingUp,   filter: 'all'    },
    { label: 'Total Terkumpul',  value: fmtShort(totalCollected), color: '#8B5CF6', icon: DollarSign, filter: 'paid' },
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, background: toast.ok ? '#10B981' : '#EF4444', color:'#fff', padding:'13px 20px', borderRadius:10, zIndex:1000, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Manajemen SPP</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Penagihan & pembayaran SPP siswa Al-Musabbihin</p>
        </div>
        <button onClick={() => setModal('create')} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
          <Plus size={17} strokeWidth={2} /> Buat Invoice
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card card-hover" style={{ padding:'18px 20px', borderLeft:`4px solid ${s.color}`, cursor:'pointer' }} onClick={() => setFilter(s.filter)}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
              <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding:24 }}>
        {/* Filter & Search */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          {[['all',`Semua (${invoices.length})`],['paid',`Lunas (${paid.length})`],['unpaid',`Belum Bayar (${unpaid.length})`]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:42,
              background: filter===val ? '#f0fafb' : '#fff', border:`1.5px solid ${filter===val ? '#319ea9' : 'var(--border)'}`, color: filter===val ? '#319ea9' : 'var(--text-3)',
            }}>{label}</button>
          ))}
          <div style={{ position:'relative', flex:'1 1 260px', minWidth:220 }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)' }} strokeWidth={1.8} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, kelas, bulan..." style={{ width:'100%', padding:'10px 14px 10px 38px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', minHeight:42 }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-4)', fontSize:15 }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-4)' }}>
            <AlertCircle size={40} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }} />
            <div style={{ fontSize:15 }}>Tidak ada invoice.</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['ID Invoice','Nama Siswa','Kelas','Bulan','Jumlah','Jatuh Tempo','Status','Aksi'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding:'14px 16px' }}><span style={{ background:'#f0fafb', color:'#319ea9', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{inv.id}</span></td>
                    <td style={{ padding:'14px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{inv.studentName}</td>
                    <td style={{ padding:'14px 16px', color:'var(--text-2)', fontSize:14 }}>{inv.class}</td>
                    <td style={{ padding:'14px 16px', color:'var(--text-2)', fontSize:14 }}>{inv.month}</td>
                    <td style={{ padding:'14px 16px', fontWeight:700, color:'#319ea9', fontSize:14 }}>{fmt(inv.amount)}</td>
                    <td style={{ padding:'14px 16px', color:'var(--text-3)', fontSize:13 }}>{fmtDate(inv.dueDate)}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={badge(inv.status)}>
                        {inv.status === 'paid' ? <><CheckCircle size={13}/> Lunas</> : <><Clock size={13}/> Belum Bayar</>}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      {inv.status === 'unpaid' && (
                        <button onClick={() => { setSelected(inv); setPayMethod('Transfer'); setModal('pay'); }} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, background:'#10B981', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:38 }}>
                          <CreditCard size={14}/> Bayar
                        </button>
                      )}
                      {inv.status === 'paid' && <span style={{ fontSize:13, color:'var(--text-4)' }}>{inv.paymentMethod || '-'}</span>}
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
        <div onClick={e => e.target===e.currentTarget && setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Buat Invoice SPP</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              {[['ID Siswa','studentId','text','STU013'],['Nama Siswa','studentName','text','Ahmad Fauzi']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>{label} <span style={{ color:'#EF4444' }}>*</span></label>
                  <input type={type} placeholder={ph as string} value={(form as any)[field]} onChange={e => setForm({...form, [field]: e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Kelas</label>
                <select value={form.class} onChange={e => setForm({...form, class:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Jumlah SPP (Rp) <span style={{ color:'#EF4444' }}>*</span></label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Bulan</label>
                <select value={form.month} onChange={e => setForm({...form, month:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }}>
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background:'#f0fafb', border:'1px solid #d5f0f3', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--text-2)' }}>
              Invoice akan dibuat dengan jatuh tempo <strong>7 hari</strong> dan status <strong>Belum Bayar</strong>.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handleCreate} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44, display:'inline-flex', alignItems:'center', gap:7 }}>
                <Plus size={16}/> {submitting ? 'Menyimpan...' : 'Buat Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran */}
      {modal === 'pay' && selected && (
        <div onClick={e => e.target===e.currentTarget && setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Catat Pembayaran</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:10, padding:16, marginBottom:20 }}>
              {[['Siswa',selected.studentName],['Kelas',selected.class],['Bulan',selected.month],['Jumlah',fmt(selected.amount)],['Jatuh Tempo',fmtDate(selected.dueDate)]].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                  <span style={{ color:'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight:700, color:'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:10 }}>Metode Pembayaran</label>
              <div style={{ display:'flex', gap:10 }}>
                {[['Transfer','🏦'],['Tunai','💵'],['QRIS','📱']].map(([m,icon]) => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ flex:1, padding:'11px 0', borderRadius:9, border:`2px solid ${payMethod===m ? '#10B981' : 'var(--border)'}`, background: payMethod===m ? '#f0fdf6' : '#fff', color: payMethod===m ? '#10B981' : 'var(--text-3)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', minHeight:44 }}>
                    {icon} {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handlePay} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#10B981', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44, display:'inline-flex', alignItems:'center', gap:7 }}>
                <CheckCircle size={16}/> {submitting ? 'Memproses...' : `Konfirmasi ${payMethod}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
