'use client';

import { useState, useEffect } from 'react';
import { payrollService } from '@/lib/api';
import { Users, DollarSign, Calculator, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function PayrollPage() {
  const [employees, setEmployees]         = useState<any[]>([]);
  const [history, setHistory]             = useState<any[]>([]);
  const [payrollResult, setPayrollResult] = useState<any>(null);
  const [loading, setLoading]             = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState({ employeeId: '', month: new Date().toISOString().slice(0, 7) });
  const [toast, setToast]                 = useState<{msg:string;ok:boolean}|null>(null);

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
    { label: 'Total Karyawan',   value: employees.length, color: '#319ea9', icon: Users },
    { label: 'Total Penggajian', value: fmt(totalGross),  color: '#3B82F6', icon: DollarSign },
    { label: 'Total Take-Home',  value: fmt(totalNet),    color: '#10B981', icon: CheckCircle },
    { label: 'Slip Diproses',    value: history.length,   color: '#F59E0B', icon: FileText },
  ];

  const slipRows: Array<[string, number, string, boolean, boolean]> = payrollResult ? [
    ['Gaji Pokok',                      payrollResult.baseSalary,              'var(--text)',  false, false],
    ['Tunjangan Sertifikasi',           payrollResult.certificationAllowance,  'var(--text)',  false, false],
    ['Tunjangan Keluarga',              payrollResult.familyAllowance,         'var(--text)',  false, false],
    ['Gaji Bruto',                      payrollResult.grossSalary,             '#319ea9',      true,  false],
    ['BPJS Kesehatan (1%)',             -payrollResult.bpjsKesehatan,          '#EF4444',      false, false],
    ['BPJS Ketenagakerjaan (5.7%)',     -payrollResult.bpjsKetenagakerjaan,    '#EF4444',      false, false],
    ['PPh 21 TER',                      -payrollResult.pphTER,                 '#EF4444',      false, false],
    ['Gaji Bersih (Take-Home)',         payrollResult.netSalary,               '#10B981',      false, true ],
  ] : [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Manajemen Penggajian</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Kelola gaji karyawan, PPh 21 TER, dan BPJS</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card card-hover anim-fadeup" style={{ padding: '18px 20px', borderTop: `3px solid ${s.color}`, animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Hitung Gaji */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={18} color="#319ea9" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Hitung Gaji</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, background: '#fff', border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'inherit', minHeight: 44, transition: 'border-color 160ms ease' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
          >
            {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showForm ? 'Tutup' : 'Hitung Baru'}
          </button>
        </div>

        {showForm && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label className="form-label">Pilih Karyawan</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="form-select">
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.position}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bulan</label>
                <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="form-input" />
              </div>
            </div>
            <button
              onClick={calculate}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 9, background: '#319ea9', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: loading ? 0.7 : 1, transition: 'background 160ms ease' }}
            >
              <Calculator size={16} /> {loading ? 'Menghitung...' : 'Hitung Gaji'}
            </button>
          </>
        )}

        {/* Pay Slip Result */}
        {payrollResult && (
          <div style={{ marginTop: 28 }} className="anim-fadeup">
            {/* Slip header */}
            <div style={{ background: 'linear-gradient(135deg, #319ea9 0%, #278a94 100%)', borderRadius: '12px 12px 0 0', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: 4 }}>Slip Gaji</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{payrollResult.employeeName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: 4 }}>Periode</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{payrollResult.month}</div>
              </div>
            </div>

            {/* Slip body */}
            <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {/* Earnings section label */}
              <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)' }}>
                Pendapatan
              </div>
              {slipRows.slice(0, 4).map(([label, val, color, isBruto]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: isBruto ? '13px 20px' : '11px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: isBruto ? '#f0fafb' : '#fff',
                    fontWeight: isBruto ? 700 : 400,
                  }}
                >
                  <span style={{ fontSize: 13, color: isBruto ? '#319ea9' : 'var(--text-3)', fontWeight: isBruto ? 700 : 500 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: isBruto ? 800 : 600, color: color as string }}>{fmt(Math.abs(val))}</span>
                </div>
              ))}

              {/* Deductions section label */}
              <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)' }}>
                Potongan
              </div>
              {slipRows.slice(4, 7).map(([label, val]) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: '#fff' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>- {fmt(Math.abs(val as number))}</span>
                </div>
              ))}

              {/* Net salary highlight */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'linear-gradient(90deg, #f0fdf6 0%, #dcfce7 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#10B981" strokeWidth={2} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>Gaji Bersih (Take-Home)</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{fmt(payrollResult.netSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Riwayat */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="#319ea9" strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Riwayat Penggajian</span>
          {history.length > 0 && (
            <span className="badge badge-info" style={{ marginLeft: 4 }}>{history.length}</span>
          )}
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-4)', fontSize: 15 }}>Belum ada riwayat. Hitung gaji untuk memulai.</div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Karyawan', 'Bulan', 'Gaji Bruto', 'Potongan', 'Take-Home', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((p, i) => (
                  <tr key={i} className="payroll-history-row" style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 150ms' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{p.employeeName || p.employeeId}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-2)', fontSize: 14 }}>{p.month}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(p.grossSalary)}</td>
                    <td style={{ padding: '13px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>- {fmt(p.grossSalary - p.netSalary)}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>{fmt(p.netSalary)}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className="badge badge-success">
                        <CheckCircle size={11} strokeWidth={2.5} /> Selesai
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Karyawan */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} color="#319ea9" strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Data Karyawan</span>
          {employees.length > 0 && (
            <span className="badge badge-info" style={{ marginLeft: 4 }}>{employees.length}</span>
          )}
        </div>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['ID', 'Nama', 'Jabatan', 'Gaji Pokok', 'Tunjangan Sertifikasi', 'Tunjangan Keluarga'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className="payroll-emp-row" style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#f5f7fa', transition: 'background 150ms' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: '#f0fafb', color: '#319ea9', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{emp.id}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{emp.name}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14 }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{emp.position}</span>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(emp.baseSalary)}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(emp.certificationAllowance)}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(emp.familyAllowance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        /* Table row hover effects */
        .payroll-history-row:hover,
        .payroll-emp-row:hover {
          background: #f0fafb !important;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          /* Stack the Hitung Gaji form grid to single column */
          .payroll-form-grid {
            grid-template-columns: 1fr !important;
          }

          /* Payroll slip: stack header items */
          .payroll-slip-header {
            flex-direction: column !important;
            text-align: left !important;
          }
          .payroll-slip-header > div:last-child {
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}
