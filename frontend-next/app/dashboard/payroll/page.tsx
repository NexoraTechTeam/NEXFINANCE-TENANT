'use client';

import { useState, useEffect } from 'react';
import { payrollService } from '@/lib/api';
import { Users, DollarSign, Calculator, FileText, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function PayrollPage() {
  const [employees, setEmployees]     = useState<any[]>([]);
  const [history, setHistory]         = useState<any[]>([]);
  const [payrollResult, setPayrollResult] = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ employeeId: '', month: new Date().toISOString().slice(0, 7) });
  const [toast, setToast]             = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    payrollService.getEmployees().then(r => { const emps = r.data.employees || []; setEmployees(emps); if (emps.length) setForm(f => ({ ...f, employeeId: emps[0].id })); }).catch(() => {});
    payrollService.getHistory().then(r => setHistory(r.data.payrolls || [])).catch(() => {});
  }, []);

  const calculate = async () => {
    if (!form.employeeId) return showToast('Pilih karyawan terlebih dahulu.', false);
    setLoading(true);
    try {
      const res = await payrollService.calculatePayroll(form);
      const emp = employees.find(e => e.id === form.employeeId);
      const result = { ...res.data, employeeName: emp?.name || form.employeeId };
      setPayrollResult(result);
      setHistory(prev => [result, ...prev]);
      showToast('Slip gaji berhasil dihitung!');
    } catch { showToast('Gagal menghitung gaji.', false); }
    finally { setLoading(false); }
  };

  const totalGross = history.reduce((s, p) => s + (p.grossSalary || 0), 0);
  const totalNet   = history.reduce((s, p) => s + (p.netSalary || 0), 0);

  const statCards = [
    { label: 'Total Karyawan',    value: employees.length,  color: '#319ea9', icon: Users },
    { label: 'Total Penggajian',  value: fmt(totalGross),   color: '#3B82F6', icon: DollarSign },
    { label: 'Total Take-Home',   value: fmt(totalNet),     color: '#10B981', icon: CheckCircle },
    { label: 'Slip Diproses',     value: history.length,    color: '#F59E0B', icon: FileText },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, background: toast.ok ? '#10B981' : '#EF4444', color:'#fff', padding:'13px 20px', borderRadius:10, zIndex:1000, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Manajemen Penggajian</h1>
        <p style={{ fontSize:14, color:'var(--text-3)' }}>Kelola gaji karyawan, PPh 21 TER, dan BPJS</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {statCards.map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card" style={{ padding:'18px 20px', borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity:0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Hitung Gaji */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showForm ? 20 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Calculator size={20} color="#319ea9" strokeWidth={1.8} />
            <span style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Hitung Gaji</span>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:9, background:'#fff', border:'1.5px solid var(--border)', fontSize:14, fontWeight:600, cursor:'pointer', color:'var(--text-2)', fontFamily:'inherit', minHeight:44 }}>
            {showForm ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            {showForm ? 'Tutup' : 'Hitung Baru'}
          </button>
        </div>

        {showForm && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Pilih Karyawan</label>
                <select value={form.employeeId} onChange={e => setForm({...form, employeeId:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }}>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.position}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:7 }}>Bulan</label>
                <input type="month" value={form.month} onChange={e => setForm({...form, month:e.target.value})} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' }} />
              </div>
            </div>
            <button onClick={calculate} disabled={loading} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:9, background:'#319ea9', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', minHeight:44 }}>
              <Calculator size={16}/> {loading ? 'Menghitung...' : 'Hitung Gaji'}
            </button>
          </>
        )}

        {payrollResult && (
          <div style={{ marginTop:24, background:'#f8fafc', borderRadius:12, padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <CheckCircle size={18} color="#10B981" strokeWidth={1.8} />
              <span style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Slip Gaji — {payrollResult.month}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[
                ['Gaji Pokok', payrollResult.baseSalary, 'var(--text)'],
                ['Tunjangan Sertifikasi', payrollResult.certificationAllowance, 'var(--text)'],
                ['Tunjangan Keluarga', payrollResult.familyAllowance, 'var(--text)'],
                ['Gaji Bruto', payrollResult.grossSalary, '#319ea9'],
                ['BPJS Kesehatan (1%)', -payrollResult.bpjsKesehatan, '#EF4444'],
                ['BPJS Ketenagakerjaan (5.7%)', -payrollResult.bpjsKetenagakerjaan, '#EF4444'],
                ['PPh 21 TER', -payrollResult.pphTER, '#EF4444'],
                ['Gaji Bersih (Take-Home)', payrollResult.netSalary, '#10B981'],
              ].map(([label, val, color]) => (
                <div key={label as string} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', gridColumn: label === 'Gaji Bersih (Take-Home)' || label === 'Gaji Bruto' ? '1/-1' : 'auto' }}>
                  <span style={{ fontSize:13, color:'var(--text-3)' }}>{label}</span>
                  <span style={{ fontSize:14, fontWeight:700, color: color as string }}>{fmt(Math.abs(val as number))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Riwayat */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <Clock size={20} color="#319ea9" strokeWidth={1.8} />
          <span style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Riwayat Penggajian</span>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-4)', fontSize:15 }}>Belum ada riwayat. Hitung gaji untuk memulai.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#f8fafc' }}>
                {['Karyawan','Bulan','Gaji Bruto','Potongan','Take-Home','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {history.map((p, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                    <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{p.employeeName || p.employeeId}</td>
                    <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{p.month}</td>
                    <td style={{ padding:'13px 16px', color:'var(--text)', fontSize:14 }}>{fmt(p.grossSalary)}</td>
                    <td style={{ padding:'13px 16px', color:'#EF4444', fontSize:14 }}>{fmt(p.grossSalary - p.netSalary)}</td>
                    <td style={{ padding:'13px 16px', color:'#10B981', fontWeight:700, fontSize:14 }}>{fmt(p.netSalary)}</td>
                    <td style={{ padding:'13px 16px' }}><span style={{ background:'#f0fdf6', color:'#10B981', padding:'4px 12px', borderRadius:999, fontSize:13, fontWeight:600 }}>Selesai</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Karyawan */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <Users size={20} color="#319ea9" strokeWidth={1.8} />
          <span style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Data Karyawan</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#f8fafc' }}>
              {['ID','Nama','Jabatan','Gaji Pokok','Tunjangan Sertifikasi','Tunjangan Keluarga'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:600, color:'var(--text-3)', borderBottom:'2px solid var(--border)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'#fff':'#fafbfc' }}>
                  <td style={{ padding:'13px 16px' }}><span style={{ background:'#f0fafb', color:'#319ea9', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700 }}>{emp.id}</span></td>
                  <td style={{ padding:'13px 16px', fontWeight:600, color:'var(--text)', fontSize:14 }}>{emp.name}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-2)', fontSize:14 }}>{emp.position}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontSize:14 }}>{fmt(emp.baseSalary)}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontSize:14 }}>{fmt(emp.certificationAllowance)}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontSize:14 }}>{fmt(emp.familyAllowance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
