'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react';
import { authService } from '@/lib/api';

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard finansial real-time',
    description: 'Ringkas KPI penting, arus kas, dan performa koleksi dalam satu tampilan.',
  },
  {
    icon: CreditCard,
    title: 'SPP & pembayaran lebih rapi',
    description: 'Pantau invoice, status pelunasan, dan histori transaksi tanpa friction.',
  },
  {
    icon: Users2,
    title: 'Payroll & tim operasional',
    description: 'Alur penggajian, approval, dan monitoring data karyawan tetap terkontrol.',
  },
  {
    icon: FileText,
    title: 'Pelaporan otomatis',
    description: 'Laporan keuangan sekolah tersusun jelas untuk audit dan pengambilan keputusan.',
  },
];

const highlights = [
  { label: 'Multi-role access', value: 'RBAC siap pakai' },
  { label: 'Operational rhythm', value: 'Aman untuk penggunaan harian' },
  { label: 'Finance clarity', value: 'Lebih rapi, cepat, dan presisi' },
];

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string') {
      return response.data.error;
    }
  }

  return 'Login gagal. Periksa email dan password Anda.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nexfinance.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb-primary" aria-hidden="true" />
      <div className="auth-orb auth-orb-secondary" aria-hidden="true" />
      <div className="auth-orb auth-orb-tertiary" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-showcase anim-fadeup">
          <div className="auth-badge">
            <Sparkles size={14} strokeWidth={2} />
            Premium finance workspace
          </div>

          <div className="auth-brand-row">
            <div className="auth-brand-mark">NF</div>
            <div>
              <div className="auth-brand-name">NexFinance</div>
              <div className="auth-brand-subtitle">Sekolah Islam Terpadu Al-Musabbihin</div>
            </div>
          </div>

          <h1 className="auth-title">
            Sistem keuangan sekolah yang terasa
            <span>mahal, rapi, dan profesional.</span>
          </h1>

          <p className="auth-copy">
            Dirancang untuk membantu tim sekolah mengelola SPP, payroll, akuntansi, dan pelaporan
            dengan workflow yang lebih tenang, presisi, dan nyaman dipakai di semua perangkat.
          </p>

          <div className="auth-highlight-list">
            {highlights.map((item) => (
              <div key={item.label} className="auth-highlight-card">
                <div className="auth-highlight-label">{item.label}</div>
                <div className="auth-highlight-value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="auth-feature-list">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="auth-feature-card">
                <span className="auth-feature-icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div>
                  <div className="auth-feature-title">{title}</div>
                  <div className="auth-feature-description">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card auth-panel anim-fadeup">
          <div className="auth-panel-top">
            <div className="auth-panel-brand">
              <div className="auth-brand-mark auth-brand-mark-small">NF</div>
              <div>
                <div className="auth-panel-brand-name">NexFinance</div>
                <div className="auth-panel-brand-subtitle">Al-Musabbihin • SIT</div>
              </div>
            </div>

            <span className="auth-status-pill">
              <CheckCircle2 size={13} strokeWidth={2.2} />
              System ready
            </span>
          </div>

          <div className="auth-panel-copy">
            <div className="auth-kicker">Masuk aman ke workspace Anda</div>
            <h2>Masuk ke Sistem</h2>
            <p>Gunakan akun yang telah didaftarkan administrator untuk melanjutkan ke dashboard.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <Mail size={16} strokeWidth={2} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexfinance.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input auth-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-visibility-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-teal auth-submit" disabled={loading}>
              <span>{loading ? 'Memproses...' : 'Masuk ke dashboard'}</span>
              {!loading && <ArrowRight size={18} strokeWidth={2.2} />}
            </button>
          </form>

          <details className="auth-demo">
            <summary>
              <Building2 size={15} strokeWidth={2} />
              Demo credentials
            </summary>
            <div className="auth-demo-content">
              <div>
                <span>Email</span>
                <strong>admin@nexfinance.com</strong>
              </div>
              <div>
                <span>Password</span>
                <strong>admin123</strong>
              </div>
            </div>
          </details>

          <div className="auth-footer">
            <div className="auth-footer-chip">
              <ShieldCheck size={14} strokeWidth={2} />
              Protected auth flow
            </div>
            <div className="auth-footer-note">© 2026 NexFinance • Al-Musabbihin</div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .auth-shell {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(18, 45, 55, 0.98) 0%, rgba(18, 41, 49, 0.96) 100%);
          color: #fff;
        }

        .auth-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 460px);
          gap: clamp(28px, 5vw, 72px);
          align-items: center;
          min-height: 100vh;
          max-width: 1380px;
          margin: 0 auto;
          padding: clamp(28px, 4vw, 44px);
        }

        .auth-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(10px);
        }

        .auth-orb-primary {
          width: 520px;
          height: 520px;
          top: -160px;
          left: -120px;
          background: radial-gradient(circle, rgba(49, 158, 169, 0.2) 0%, transparent 68%);
        }

        .auth-orb-secondary {
          width: 460px;
          height: 460px;
          right: -140px;
          bottom: -180px;
          background: radial-gradient(circle, rgba(49, 158, 169, 0.16) 0%, transparent 72%);
        }

        .auth-orb-tertiary {
          width: 240px;
          height: 240px;
          left: 48%;
          top: 26%;
          background: radial-gradient(circle, rgba(165, 243, 252, 0.1) 0%, transparent 70%);
        }

        .auth-showcase {
          position: relative;
          z-index: 1;
          max-width: 760px;
        }

        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(49, 158, 169, 0.14);
          border: 1px solid rgba(91, 200, 211, 0.24);
          color: #9de8ee;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.38px;
          text-transform: uppercase;
        }

        .auth-brand-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 26px;
          margin-bottom: 20px;
        }

        .auth-brand-mark {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: linear-gradient(135deg, #319ea9 0%, #278a94 100%);
          color: #fff;
          font-size: 18px;
          font-weight: 800;
          box-shadow: 0 20px 34px rgba(49, 158, 169, 0.24);
          flex-shrink: 0;
        }

        .auth-brand-mark-small {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          font-size: 15px;
          box-shadow: 0 14px 24px rgba(49, 158, 169, 0.2);
        }

        .auth-brand-name,
        .auth-panel-brand-name {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.3px;
        }

        .auth-brand-subtitle,
        .auth-panel-brand-subtitle {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.56);
          font-size: 13px;
        }

        .auth-title {
          margin-top: 14px;
          font-size: clamp(38px, 5vw, 68px);
          line-height: 1.02;
          letter-spacing: -1.6px;
          font-weight: 800;
          max-width: 720px;
        }

        .auth-title span {
          display: block;
          color: #77d8e0;
        }

        .auth-copy {
          margin-top: 22px;
          max-width: 620px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          line-height: 1.85;
        }

        .auth-highlight-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 34px;
        }

        .auth-highlight-card {
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .auth-highlight-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.36px;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 8px;
        }

        .auth-highlight-value {
          font-size: 15px;
          line-height: 1.5;
          color: #fff;
          font-weight: 700;
        }

        .auth-feature-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }

        .auth-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .auth-feature-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(49, 158, 169, 0.14);
          color: #8fe5ec;
          border: 1px solid rgba(91, 200, 211, 0.18);
        }

        .auth-feature-title {
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
        }

        .auth-feature-description {
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 13px;
          line-height: 1.65;
        }

        .auth-panel {
          position: relative;
          z-index: 1;
          padding: clamp(24px, 4vw, 36px);
        }

        .auth-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 26px;
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .auth-panel-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(49, 158, 169, 0.12);
          border: 1px solid rgba(91, 200, 211, 0.18);
          color: #9ce7ee;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .auth-panel-copy h2 {
          font-size: clamp(28px, 4vw, 36px);
          line-height: 1.05;
          letter-spacing: -0.8px;
          font-weight: 800;
        }

        .auth-kicker {
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #7edbe3;
          letter-spacing: 0.36px;
          text-transform: uppercase;
        }

        .auth-panel-copy p {
          margin-top: 12px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 14px;
          line-height: 1.7;
        }

        .auth-error {
          margin-top: 22px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.22);
          color: #fecaca;
          font-size: 13px;
          line-height: 1.6;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 24px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.34px;
        }

        .auth-input-wrap {
          position: relative;
        }

        .auth-input-wrap .glass-input {
          padding-left: 44px;
        }

        .auth-password-input {
          padding-right: 48px !important;
        }

        .auth-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.38);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .auth-visibility-toggle {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.46);
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease;
        }

        .auth-visibility-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.84);
        }

        .auth-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 6px;
        }

        .auth-demo {
          margin-top: 22px;
          border-radius: 18px;
          border: 1px solid rgba(91, 200, 211, 0.16);
          background: rgba(6, 19, 25, 0.26);
          overflow: hidden;
        }

        .auth-demo summary {
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          cursor: pointer;
          color: #98e4eb;
          font-size: 13px;
          font-weight: 700;
        }

        .auth-demo summary::-webkit-details-marker {
          display: none;
        }

        .auth-demo-content {
          display: grid;
          gap: 10px;
          padding: 0 16px 16px;
        }

        .auth-demo-content div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.74);
          font-size: 13px;
        }

        .auth-demo-content span {
          color: rgba(255, 255, 255, 0.44);
          text-transform: uppercase;
          letter-spacing: 0.28px;
          font-size: 11px;
          font-weight: 700;
        }

        .auth-demo-content strong {
          color: #d7fbff;
          font-size: 13px;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }

        .auth-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .auth-footer-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.76);
          font-size: 12px;
          font-weight: 600;
        }

        .auth-footer-note {
          color: rgba(255, 255, 255, 0.34);
          font-size: 12px;
        }

        @media (max-width: 1080px) {
          .auth-grid {
            grid-template-columns: 1fr;
            align-items: start;
            padding-top: 24px;
            padding-bottom: 32px;
          }

          .auth-showcase {
            order: 2;
            max-width: none;
          }

          .auth-panel {
            order: 1;
            max-width: 560px;
            width: 100%;
            margin: 0 auto;
          }
        }

        @media (max-width: 820px) {
          .auth-shell {
            background:
              linear-gradient(180deg, rgba(18, 45, 55, 1) 0%, rgba(17, 36, 45, 1) 100%);
          }

          .auth-grid {
            gap: 20px;
            min-height: auto;
            padding: 18px 14px 26px;
          }

          .auth-panel-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .auth-highlight-list,
          .auth-feature-list {
            grid-template-columns: 1fr;
          }

          .auth-title {
            font-size: clamp(32px, 10vw, 48px);
            letter-spacing: -1.2px;
          }

          .auth-copy {
            font-size: 15px;
            line-height: 1.75;
          }
        }

        @media (max-width: 560px) {
          .auth-showcase {
            display: none;
          }

          .auth-panel {
            max-width: none;
          }

          .auth-panel-copy h2 {
            font-size: 30px;
          }

          .auth-demo-content div {
            flex-direction: column;
            align-items: flex-start;
          }

          .auth-footer {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
