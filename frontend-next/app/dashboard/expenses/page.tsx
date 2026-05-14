'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/lib/api';
import { FileText, CheckCircle, XCircle, Clock, Plus, DollarSign, X } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const CATEGORIES = ['ATK & Supplies','Operasional','Pemeliharaan','Transportasi','Konsumsi','Utilitas','Lain-lain'];

const statusBadge = (s: string) => {
  const map: Record<string, [string, string, string]> = {
    pending:  ['#F59E0B', '#fffbeb', 'Menunggu'],
    approved: ['#10B981', '#f0fdf6', 'Disetujui'],
    rejected: ['#EF4444', '#fff5f5', 'Ditolak'],
  };
  const [color, bg, label] = map[s] || ['#6b7280', '#f3f4f6', s];
  return { style: { color, background: bg, padding:'4px 12px', borderRadius:999, fontSize:13, fontWeight:700, display:'inline-block' }, label };
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
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, background: toast.ok ? '#10B981' : '#EF4444', color:'#fff', padding:'13px 20px', borderRadius:10, zIndex:1000, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Pengeluaran</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Pengajuan & persetujuan pengeluaran operasional</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
          <Plus size={17} strokeWidth={2} /> Ajukan Pengeluaran
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Pengajuan', value: expenses.length,       color:'#319ea9', icon: FileText,    filter:'all'     },
          { label:'Menunggu',        value: pending.length,        color:'#F59E0B', icon: Clock,       filter:'pending' },
          { label:'Disetujui',       value: approved.length,       color:'#10B981', icon: CheckCircle, filter:'approved'},
          { label:'Total Disetujui', value: fmt(totalApproved),   color:'#3B82F6', icon: DollarSign,  filter:'approved'},
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card card-hover" style={{ padding:'18px 20px', borderLeft:`4px solid ${s.color}`, cursor:'pointer' }} onClick={() => setFilter(s.filter)}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {[['all','Semua'],['pending','Menunggu'],['approved','Disetujui'],['rejected','Ditolak']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:42,
              background: filter===val ? '#f0fafb' : '#fff', border:`1.5px solid ${filter===val ? '#319ea9' : 'var(--border)'}`, color: filter===val ? '#319ea9' : 'var(--text-3)',
            }}>{label}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Memuat data...</div>
        : filtered.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Tidak ada data pengeluaran.</div>
        : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#f8fafc' }}>
                {['Judul','Kategori','Jumlah','Tanggal','Status','Aksi'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((e, i) => {
                  const { style: bs, label: bl } = statusBadge(e.status);
                  return (
                    <tr key={e.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{e.title}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{e.category}</td>
                      <td style={{ padding:'13px 16px', fontWeight:700, color:'#319ea9', fontSize:14 }}>{fmt(e.amount)}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-3)', fontSize:13 }}>{e.submittedAt ? new Date(e.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding:'13px 16px' }}><span style={bs}>{bl}</span></td>
                      <td style={{ padding:'13px 16px' }}>
                        {e.status === 'pending' && (
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => handleApprove(e.id)} style={{ padding:'7px 14px', borderRadius:7, background:'#10B981', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:36, display:'inline-flex', alignItems:'center', gap:5 }}>
                              <CheckCircle size={14}/> Setuju
                            </button>
                            <button onClick={() => handleReject(e.id)} style={{ padding:'7px 14px', borderRadius:7, background:'#EF4444', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:36, display:'inline-flex', alignItems:'center', gap:5 }}>
                              <XCircle size={14}/> Tolak
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
        <div onClick={e => e.target===e.currentTarget && setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Ajukan Pengeluaran</div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              {[['Judul Pengeluaran','title','text','Pembelian ATK'],['Jumlah (Rp)','amount','number','500000']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>{label} <span style={{ color:'#EF4444' }}>*</span></label>
                  <input type={type as string} placeholder={ph as string} value={(form as any)[field]} onChange={e => setForm({...form, [field]:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Kategori</label>
                <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Keterangan</label>
                <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={3} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44, display:'inline-flex', alignItems:'center', gap:7 }}>
                <Plus size={16}/> {submitting ? 'Menyimpan...' : 'Ajukan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
