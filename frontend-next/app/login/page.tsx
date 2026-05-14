'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nexfinance.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=86400`;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(41,87,97,0.76) 0%, rgba(21,47,55,0.78) 100%)',
        backgroundColor: '#152f37',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px,560px) minmax(340px,430px)',
        gap: 'clamp(28px, 6vw, 86px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px clamp(20px, 5vw, 80px)',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
      className="login-main"
    >
      {/* ── Left copy ── */}
      <div className="anim-fadeup" style={{ color: '#fff' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 999,
          background: 'rgba(49,158,169,0.18)', border: '1px solid rgba(49,158,169,0.35)',
          fontSize: 12, fontWeight: 600, color: '#319ea9', marginBottom: 28,
          letterSpacing: '0.5px',
        }}>
          SEKOLAH ISLAM TERPADU AL-MUSABBIHIN
        </div>

        <h1 style={{
          fontSize: 'clamp(34px, 4vw, 52px)',
          fontWeight: 800, lineHeight: 1.1,
          marginBottom: 16, color: '#fff',
        }}>
          NexFinance<br />
          <span style={{ color: '#319ea9' }}>Al-Musabbihin</span>
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
          Sistem keuangan terpadu untuk mengelola SPP, penggajian, akuntansi,
          dan laporan keuangan sekolah secara efisien.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['📊', 'Dashboard Keuangan Real-time'],
            ['💳', 'Manajemen SPP & Pembayaran'],
            ['👥', 'Sistem Penggajian Karyawan'],
            ['📋', 'Laporan Keuangan Otomatis'],
          ].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(49,158,169,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form ── */}
      <div
        className="anim-fadeup glass-card"
        style={{ padding: 'clamp(28px, 4vw, 42px)', animationDelay: '0.1s' }}
      >
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Masuk ke Sistem</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            Gunakan akun yang telah didaftarkan oleh administrator
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#fca5a5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email"
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexfinance.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-teal" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo info */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'rgba(49,158,169,0.1)',
          border: '1px solid rgba(49,158,169,0.25)',
          borderRadius: 10,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.7,
        }}>
          <span style={{ color: '#319ea9', fontWeight: 600 }}>Demo:</span>{' '}
          admin@nexfinance.com / admin123
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 NexFinance · Al-Musabbihin
        </p>
      </div>

      <style jsx global>{`
        @media (max-width: 860px) {
          .login-main {
            grid-template-columns: 1fr !important;
            padding: 30px 20px !important;
          }
        }
      `}</style>
    </main>
  );
}
