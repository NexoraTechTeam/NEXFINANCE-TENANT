'use client';

import { useState, useEffect, useCallback } from 'react';
import { accountingService } from '@/lib/api';
import { BookOpen, Plus, List, X } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function AccountingPage() {
  const [accounts, setAccounts]   = useState<any[]>([]);
  const [journals, setJournals]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'coa'|'journal'>('journal');
  const [modal, setModal]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null);
  const [form, setForm]           = useState({ description:'', debitAccount:'', creditAccount:'', amount:'' });

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try {
      const [coaRes, jRes] = await Promise.all([accountingService.getChartOfAccounts(), accountingService.getJournals()]);
      setAccounts(coaRes.data.accounts || []); setJournals(jRes.data.journals || []);
    } catch { setAccounts([]); setJournals([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.debitAccount || !form.creditAccount) return showToast('Lengkapi semua field.', false);
    setSubmitting(true);
    try { await accountingService.createJournal({ ...form, amount: Number(form.amount) }); await load(); setModal(false); setForm({ description:'', debitAccount:'', creditAccount:'', amount:'' }); showToast('Jurnal berhasil dibuat!'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal membuat jurnal.', false); }
    finally { setSubmitting(false); }
  };

  const totalDebit  = journals.reduce((s, j) => s + (j.amount || 0), 0);
  const totalCredit = journals.reduce((s, j) => s + (j.amount || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, background: toast.ok ? '#10B981' : '#EF4444', color:'#fff', padding:'13px 20px', borderRadius:10, zIndex:1000, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Akuntansi</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Jurnal umum & chart of accounts</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
          <Plus size={17} strokeWidth={2} /> Tambah Jurnal
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Akun',    value: accounts.length,   color:'#319ea9', icon: BookOpen },
          { label:'Total Jurnal',  value: journals.length,   color:'#3B82F6', icon: List },
          { label:'Total Debit',   value: fmt(totalDebit),   color:'#10B981', icon: Plus },
          { label:'Total Kredit',  value: fmt(totalCredit),  color:'#F59E0B', icon: Plus },
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card" style={{ padding:'18px 20px', borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid var(--border)' }}>
        {[['journal','Jurnal Umum'],['coa','Chart of Accounts']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val as 'coa'|'journal')} style={{ padding:'11px 22px', borderRadius:'8px 8px 0 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:'none', border:'none', borderBottom: tab===val ? '3px solid #319ea9' : '3px solid transparent', color: tab===val ? '#319ea9' : 'var(--text-3)', marginBottom:-2, minHeight:44 }}>{label}</button>
        ))}
      </div>

      <div className="card" style={{ padding:24 }}>
        {loading ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Memuat data...</div>
        : tab === 'journal' ? (
          journals.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Belum ada jurnal. Tambah jurnal untuk memulai.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f8fafc' }}>
                  {['ID','Tanggal','Deskripsi','Akun Debit','Akun Kredit','Jumlah'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {journals.map((j, i) => (
                    <tr key={j.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px' }}><span style={{ background:'#f0fafb', color:'#319ea9', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700 }}>{j.id}</span></td>
                      <td style={{ padding:'13px 16px', color:'var(--text-3)', fontSize:13 }}>{j.date ? new Date(j.date).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{j.description}</td>
                      <td style={{ padding:'13px 16px', color:'#10B981', fontSize:14, fontWeight:600 }}>{j.debitAccount}</td>
                      <td style={{ padding:'13px 16px', color:'#EF4444', fontSize:14, fontWeight:600 }}>{j.creditAccount}</td>
                      <td style={{ padding:'13px 16px', fontWeight:700, color:'var(--text)', fontSize:14 }}>{fmt(j.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        ) : (
          accounts.length === 0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Belum ada akun.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f8fafc' }}>
                  {['Kode Akun','Nama Akun','Tipe','Saldo Normal'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {accounts.map((acc, i) => (
                    <tr key={acc.code} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'13px 16px' }}><span style={{ background:'#f0fafb', color:'#319ea9', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{acc.code}</span></td>
                      <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{acc.name}</td>
                      <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{acc.type}</td>
                      <td style={{ padding:'13px 16px', color: acc.normalBalance==='Debit' ? '#10B981' : '#EF4444', fontWeight:600, fontSize:14 }}>{acc.normalBalance}</td>
                    </tr>
                  ))}
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
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>Tambah Jurnal</div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              {[['Deskripsi','description','text','Pembayaran gaji bulan Mei'],['Akun Debit','debitAccount','text','1-101 Kas'],['Akun Kredit','creditAccount','text','2-201 Utang Gaji'],['Jumlah (Rp)','amount','number','']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>{label} <span style={{ color:'#EF4444' }}>*</span></label>
                  <input type={type as string} placeholder={ph as string} value={(form as any)[field]} onChange={e => setForm({...form, [field]:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'11px 20px', borderRadius:8, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>Batal</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ padding:'11px 20px', borderRadius:8, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44 }}>
                {submitting ? 'Menyimpan...' : 'Simpan Jurnal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
