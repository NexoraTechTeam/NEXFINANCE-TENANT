'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, CreditCard, Users2, FileText, Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import { authService } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nexfinance.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const features = [
    { icon: BarChart2, label: 'Dashboard Keuangan Real-time' },
    { icon: CreditCard, label: 'Manajemen SPP & Pembayaran' },
    { icon: Users2,   label: 'Sistem Penggajian Karyawan' },
    { icon: FileText, label: 'Laporan Keuangan Otomatis' },
  ];

  return (
    <main className="login-main">
      {/* ── Decorative background circles ── */}
      <div className="bg-circle bg-circle-1" aria-hidden="true" />
      <div className="bg-circle bg-circle-2" aria-hidden="true" />
      <div className="bg-circle bg-circle-3" aria-hidden="true" />

      {/* ── Left copy ── */}
      <div className="login-left anim-fadeup" style={{ color: '#fff' }}>
        {/* Gradient badge */}
        <div className="brand-badge">
          <ShieldCheck size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          SISTEM KEUANGAN TERPADU
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 3.8vw, 50px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 10,
          color: '#fff',
        }}>
          NexFinance
          <br />
          <span style={{ color: '#319ea9' }}>Al-Musabbihin</span>
        </h1>

        <p style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.50)',
          fontWeight: 500,
          marginBottom: 28,
          letterSpacing: '0.2px',
        }}>
          Sekolah Islam Terpadu Al-Musabbihin
        </p>

        <p style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.70)',
          lineHeight: 1.75,
          marginBottom: 36,
          maxWidth: 400,
        }}>
          Sistem keuangan terpadu untuk mengelola SPP, penggajian, akuntansi,
          dan laporan keuangan sekolah secara efisien.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map(({ icon: Icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 13,
              fontSize: 14, color: 'rgba(255,255,255,0.78)',
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(49,158,169,0.16)',
                border: '1px solid rgba(49,158,169,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: '#5bc8d3',
              }}>
                <Icon size={16} strokeWidth={2} />
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="trust-row">
          <span className="trust-dot" />
          <span>Aman</span>
          <span className="trust-sep">·</span>
          <span>Terpercaya</span>
          <span className="trust-sep">·</span>
          <span>Real-time</span>
        </div>
      </div>

      {/* ── Right form ── */}
      <div
        className="login-right anim-fadeup glass-card"
        style={{ padding: 'clamp(28px, 4vw, 44px)', animationDelay: '0.12s' }}
      >
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: '#fff', marginBottom: 5 }}>
            Masuk ke Sistem
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
            Gunakan akun yang telah didaftarkan oleh administrator
          </p>
        </div>

        {/* Subtle divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, rgba(49,158,169,0.45) 0%, rgba(255,255,255,0.10) 60%, transparent 100%)',
          margin: '20px 0',
        }} />

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderLeft: '3px solid #ef4444',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: '#fca5a5',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email field */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.60)', marginBottom: 8,
              letterSpacing: '0.4px', textTransform: 'uppercase',
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center',
              }}>
                <Mail size={16} strokeWidth={2} />
              </span>
              <input
                type="email"
                className="glass-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexfinance.com"
                required
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.60)', marginBottom: 8,
              letterSpacing: '0.4px', textTransform: 'uppercase',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center',
              }}>
                <Lock size={16} strokeWidth={2} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="glass-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: 42, paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center',
                  padding: 4, borderRadius: 6,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-teal"
            disabled={loading}
            style={{ marginTop: 2 }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo credentials code block */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(49,158,169,0.28)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '7px 14px',
              background: 'rgba(49,158,169,0.12)',
              borderBottom: '1px solid rgba(49,158,169,0.20)',
              fontSize: 11,
              fontWeight: 700,
              color: '#5bc8d3',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#5bc8d3', display: 'inline-block',
              }} />
              Demo Credentials
            </div>
            <div style={{
              padding: '10px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>email&nbsp;&nbsp;&nbsp;</span>
              <span style={{ color: '#a5f3fc' }}>admin@nexfinance.com</span>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>password </span>
              <span style={{ color: '#a5f3fc' }}>admin123</span>
            </div>
          </div>
        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
          © 2026 NexFinance · Al-Musabbihin
        </p>
      </div>

      <style jsx global>{`
        .login-main {
          min-height: 100vh;
          background:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(49,158,169,0.055)' stroke-width='0.5'/%3E%3C/svg%3E"),
            linear-gradient(180deg, rgba(41,87,97,0.76) 0%, rgba(21,47,55,0.78) 100%);
          background-color: #152f37;
          display: grid;
          grid-template-columns: minmax(280px, 540px) minmax(340px, 430px);
          gap: clamp(28px, 6vw, 86px);
          align-items: center;
          justify-content: center;
          padding: 40px clamp(20px, 5vw, 80px);
          font-family: 'Inter', Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Decorative floating circles */
        .bg-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .bg-circle-1 {
          width: 420px; height: 420px;
          top: -140px; right: -80px;
          background: radial-gradient(circle, rgba(49,158,169,0.12) 0%, transparent 70%);
        }
        .bg-circle-2 {
          width: 300px; height: 300px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, rgba(49,158,169,0.09) 0%, transparent 70%);
        }
        .bg-circle-3 {
          width: 180px; height: 180px;
          top: 55%; left: 38%;
          background: radial-gradient(circle, rgba(49,158,169,0.07) 0%, transparent 70%);
        }

        .login-left,
        .login-right {
          position: relative;
          z-index: 1;
        }

        /* Gradient badge */
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(49,158,169,0.22) 0%, rgba(49,158,169,0.10) 100%);
          border: 1px solid rgba(49,158,169,0.40);
          font-size: 11px;
          font-weight: 700;
          color: #5bc8d3;
          margin-bottom: 26px;
          letter-spacing: '0.6px';
          text-transform: uppercase;
        }

        /* Trust row */
        .trust-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 12px;
          color: rgba(255,255,255,0.38);
          font-weight: 500;
          letter-spacing: 0.3px;
        }
        .trust-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #319ea9;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(49,158,169,0.6);
          animation: pulse-dot 2.2s ease-in-out infinite;
        }
        .trust-sep { color: rgba(255,255,255,0.18); }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        /* ── Mobile: 760px breakpoint ── */
        @media (max-width: 760px) {
          .login-main {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto;
            padding: 28px 18px 36px !important;
            gap: 28px !important;
            align-items: start;
          }

          /* Form (right) comes first on mobile */
          .login-right { order: -1; }
          .login-left  { order:  1; }

          /* Condense left copy on mobile */
          .login-left p:first-of-type {
            display: none;
          }
          .trust-row {
            margin-top: 20px;
            padding-top: 14px;
          }

          .bg-circle-1 { width: 260px; height: 260px; top: -80px; right: -60px; }
          .bg-circle-2 { width: 180px; height: 180px; }
          .bg-circle-3 { display: none; }
        }

        @media (max-width: 400px) {
          .login-main {
            padding: 20px 14px 28px !important;
          }
        }
      `}</style>
    </main>
  );
}
