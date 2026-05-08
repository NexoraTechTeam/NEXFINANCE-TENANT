import React, { useState, useEffect } from 'react';
import { payrollService } from '../services/api';
import { Users, DollarSign, Calculator, FileText, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginBottom: '32px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#2C3E50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' },
  btn: { background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnSecondary: { background: 'white', color: '#41A9A9', border: '2px solid #41A9A9', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#F8FAFC', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#2C3E50', borderBottom: '1px solid #F3F4F6' },
  badge: (color) => ({ background: color + '20', color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }),
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '6px', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' },
  alert: { background: '#EFF6F6', border: '1px solid #41A9A9', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#2C3E50', fontSize: '14px' },
};

const PayrollManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [payrollResult, setPayrollResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employeeId: 'EMP001', month: new Date().toISOString().slice(0, 7) });
  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    payrollService.getEmployees()
      .then(r => setEmployees(r.data.employees))
      .catch(() => setEmployees([{ id: 'EMP001', name: 'Budi Santoso', position: 'Guru', baseSalary: 5000000, certificationAllowance: 5000000, familyAllowance: 250000 }]));
  }, []);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await payrollService.calculatePayroll(form);
      const result = res.data;
      setPayrollResult(result);
      setHistory(prev => [{ ...result, employeeName: employees.find(e => e.id === form.employeeId)?.name || form.employeeId }, ...prev]);
    } catch {
      alert('Gagal menghitung payroll. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const totalGross = history.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = history.reduce((s, p) => s + p.netSalary, 0);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.title}>💼 Manajemen Penggajian</div>
        <div style={styles.subtitle}>Kelola gaji karyawan, PPh 21 TER, dan BPJS — Sekolah Islam Terpadu Al-Musabbihin</div>

        <div style={styles.statsGrid}>
          {[
            { label: 'Total Karyawan', value: employees.length, icon: Users, color: '#41A9A9' },
            { label: 'Total Penggajian', value: fmt(totalGross), icon: DollarSign, color: '#2C3E50' },
            { label: 'Total Take-Home', value: fmt(totalNet), icon: CheckCircle, color: '#10B981' },
            { label: 'Slip Proses', value: history.length, icon: FileText, color: '#F59E0B' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ ...styles.statCard, borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50' }}>{s.value}</div>
                <Icon size={20} color={s.color} style={{ opacity: 0.4, marginTop: '8px' }} />
              </div>
            );
          })}
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={styles.cardTitle}><Calculator size={20} color="#41A9A9" /> Hitung Gaji</div>
            <button style={styles.btnSecondary} onClick={() => setShowForm(!showForm)}>
              {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showForm ? 'Tutup' : 'Hitung Baru'}
            </button>
          </div>

          {showForm && (
            <>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Pilih Karyawan</label>
                  <select style={styles.input} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.position}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Bulan</label>
                  <input type="month" style={styles.input} value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
                </div>
              </div>
              <button style={styles.btn} onClick={calculate} disabled={loading}>
                <Calculator size={16} />
                {loading ? 'Menghitung...' : 'Hitung Gaji'}
              </button>
            </>
          )}

          {payrollResult && (
            <div style={{ marginTop: '24px', background: '#F8FAFC', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#2C3E50', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#10B981" /> Slip Gaji — {payrollResult.month}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['Gaji Pokok', payrollResult.baseSalary, '#2C3E50'],
                  ['Tunjangan Sertifikasi', payrollResult.certificationAllowance, '#2C3E50'],
                  ['Tunjangan Keluarga', payrollResult.familyAllowance, '#2C3E50'],
                  ['Gaji Bruto', payrollResult.grossSalary, '#41A9A9'],
                  ['BPJS Kesehatan (1%)', -payrollResult.bpjsKesehatan, '#EF4444'],
                  ['BPJS Ketenagakerjaan (5.7%)', -payrollResult.bpjsKetenagakerjaan, '#EF4444'],
                  ['PPh 21 TER (5%)', -payrollResult.pphTER, '#EF4444'],
                  ['Gaji Bersih (Take-Home)', payrollResult.netSalary, '#10B981'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color }}>{fmt(Math.abs(val))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}><Clock size={20} color="#41A9A9" /> Riwayat Penggajian</div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: '14px' }}>Belum ada riwayat penggajian. Hitung gaji untuk memulai.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Karyawan', 'Bulan', 'Gaji Bruto', 'Potongan', 'Take-Home', 'Status'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                      <td style={styles.td}>{p.employeeName || p.employeeId}</td>
                      <td style={styles.td}>{p.month}</td>
                      <td style={styles.td}>{fmt(p.grossSalary)}</td>
                      <td style={styles.td}><span style={{ color: '#EF4444' }}>{fmt(p.grossSalary - p.netSalary)}</span></td>
                      <td style={styles.td}><span style={{ color: '#10B981', fontWeight: '700' }}>{fmt(p.netSalary)}</span></td>
                      <td style={styles.td}><span style={styles.badge('#10B981')}>Selesai</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}><Users size={20} color="#41A9A9" /> Data Karyawan</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['ID', 'Nama', 'Jabatan', 'Gaji Pokok', 'Tunjangan Sertifikasi', 'Tunjangan Keluarga'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={styles.td}><span style={{ background: '#EFF6F6', color: '#41A9A9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{emp.id}</span></td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{emp.name}</td>
                    <td style={styles.td}>{emp.position}</td>
                    <td style={styles.td}>{fmt(emp.baseSalary)}</td>
                    <td style={styles.td}>{fmt(emp.certificationAllowance)}</td>
                    <td style={styles.td}>{fmt(emp.familyAllowance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
