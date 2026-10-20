'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
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
import { NexoraLogo } from '@/components/brand/BrandMark';
import TenantMark from '@/components/tenant/TenantMark';
import { useTenant } from '@/components/tenant/TenantProvider';
import { brandLines } from '@/lib/tenant';

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
      return response.data.error === 'Invalid credentials'
        ? 'Email/username atau password salah.'
        : response.data.error;
    }
  }

  return 'Login gagal. Periksa email/username dan password Anda.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const tenant = useTenant();
  const brand = brandLines(tenant);
  const photo = tenant.loginImageUrl;
  const photoAlt = `Foto ${tenant.shortName}`;
  const place = tenant.schoolInfo.city;

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
    <main className={`auth-shell${photo ? ' has-photo' : ''}`}>
      {photo && <div className="auth-photo-bg" style={{ backgroundImage: `url("${photo}")` }} aria-hidden="true" />}
      <div className="auth-orb auth-orb-primary" aria-hidden="true" />
      <div className="auth-orb auth-orb-secondary" aria-hidden="true" />
      <div className="auth-orb auth-orb-tertiary" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-showcase anim-fadeup">
          {!photo && (
            <div className="auth-badge">
              <Sparkles size={14} strokeWidth={2} />
              Premium finance workspace
            </div>
          )}

          <div className="auth-brand-row">
            <div className="auth-brand-mark"><TenantMark size={54} /></div>
            <div>
              <div className="auth-brand-name">{brand.title}</div>
              <div className="auth-brand-subtitle">{brand.subtitle}</div>
            </div>
          </div>

          {photo ? (
            <>
              <h1 className="auth-title auth-title-compact">
                Selamat datang di
                <span>{tenant.shortName}</span>
              </h1>
              <figure className="auth-photo-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- tenant asset served by the API */}
                <img src={photo} alt={photoAlt} />
                <figcaption>
                  <span>{tenant.name}</span>
                  {place && <span className="auth-photo-place">{place}</span>}
                </figcaption>
              </figure>
              <p className="auth-copy">
                Portal keuangan sekolah: SPP, penggajian, pengeluaran, pengadaan, dan laporan keuangan dalam satu tempat.
              </p>
            </>
          ) : (
          <>
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
          </>
          )}
        </section>

        <section className="glass-card auth-panel anim-fadeup">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- tenant asset served by the API
            <img className="auth-panel-photo" src={photo} alt={photoAlt} />
          )}
          <div className="auth-panel-top">
            <div className="auth-panel-brand">
              <div className="auth-brand-mark auth-brand-mark-small"><TenantMark size={42} /></div>
              <div>
                <div className="auth-panel-brand-name">{brand.title}</div>
                <div className="auth-panel-brand-subtitle">{brand.subtitle}</div>
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
                Email atau username
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <Mail size={16} strokeWidth={2} />
                </span>
                <input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email atau username"
                  autoComplete="username"
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
                  placeholder="Masukkan password Anda"
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

          <div className="auth-footer">
            <div className="auth-footer-chip">
              <ShieldCheck size={14} strokeWidth={2} />
              Protected auth flow
            </div>
            <div className="auth-footer-note">© {new Date().getFullYear()} {tenant.name}</div>
          </div>
          {tenant.showPoweredBy && (
            <div className="auth-powered">
              <span>NexFinance — produk dari</span>
              <NexoraLogo height={20} />
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        /* ── Keyframe animations ── */
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          33%       { transform: translateY(-18px) scale(1.04); }
          66%       { transform: translateY(10px) scale(0.97); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.9; transform: translateX(0px) scale(1); }
          50%       { opacity: 1; transform: translateX(14px) scale(1.05); }
        }
        @keyframes orbDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-12px, -8px) scale(1.06); }
          70%       { transform: translate(8px, 6px) scale(0.95); }
        }
        @keyframes brandGradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cardGlowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgb(var(--brand-500-rgb) / 0); }
          50%       { box-shadow: 0 0 18px 4px rgb(var(--brand-500-rgb) / 0.18); }
        }

        /* ── Shell ── */
        .auth-shell {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, rgb(var(--nx-navy-deep-rgb) / 0.98) 0%, rgb(var(--nx-navy-deep-rgb) / 0.96) 100%);
          color: #fff;
        }

        /* ── School photo (set in the Console) ── */
        .auth-photo-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(40px) saturate(1.2) brightness(0.8);
          transform: scale(1.15);
        }
        .auth-shell.has-photo::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(100deg, rgb(var(--nx-navy-deep-rgb) / 0.96) 0%, rgb(var(--nx-navy-deep-rgb) / 0.9) 50%, rgb(var(--nx-navy-deep-rgb) / 0.84) 100%);
        }
        .auth-shell.has-photo .auth-orb { opacity: 0.45; }
        .auth-title-compact {
          font-size: clamp(34px, 3.4vw, 52px) !important;
        }
        .auth-photo-card {
          margin: 22px 0 0;
          max-width: 680px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          background: rgba(255, 255, 255, 0.04);
        }
        .auth-photo-card img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }
        .auth-photo-card figcaption {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.86);
          background: rgb(var(--nx-navy-deep-rgb) / 0.72);
        }
        .auth-photo-place { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
        .auth-panel-photo { display: none; }
        @media (max-width: 1080px) {
          .auth-photo-bg { display: none; }
        }

        /* ── Grid ── */
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

        /* ── Animated background orbs ── */
        .auth-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(10px);
        }

        .auth-orb-primary {
          width: 560px;
          height: 560px;
          top: -160px;
          left: -120px;
          background: radial-gradient(circle, rgb(var(--brand-500-rgb) / 0.22) 0%, rgb(var(--brand-600-rgb) / 0.1) 50%, transparent 72%);
          animation: orbFloat 14s ease-in-out infinite;
        }

        .auth-orb-secondary {
          width: 500px;
          height: 500px;
          right: -140px;
          bottom: -180px;
          background: radial-gradient(circle, rgb(var(--nx-purple-rgb) / 0.30) 0%, rgb(var(--nx-purple-rgb) / 0.10) 52%, transparent 76%);
          animation: orbPulse 18s ease-in-out infinite;
        }

        .auth-orb-tertiary {
          width: 280px;
          height: 280px;
          left: 48%;
          top: 26%;
          background: radial-gradient(circle, rgb(var(--nx-gold-rgb) / 0.12) 0%, transparent 70%);
          animation: orbDrift 22s ease-in-out infinite;
        }

        /* ── Showcase (left panel) ── */
        .auth-showcase {
          position: relative;
          z-index: 1;
          max-width: 760px;
        }

        /* ── Badge ── */
        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgb(var(--brand-500-rgb) / 0.14);
          border: 1px solid rgb(var(--brand-300-rgb) / 0.24);
          color: var(--brand-100);
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

        /* ── Animated brand mark ── */
        .auth-brand-mark {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 16px 34px rgb(var(--brand-500-rgb) / 0.38), 0 0 0 1px rgba(255,255,255,0.12);
          flex-shrink: 0;
        }
        .auth-brand-mark img { width: 100%; height: 100%; }

        .auth-powered {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }

        .auth-brand-mark-small {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          box-shadow: 0 12px 24px rgb(var(--brand-500-rgb) / 0.3), 0 0 0 1px rgba(255,255,255,0.12);
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

        /* ── Title ── */
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
          background: linear-gradient(90deg, var(--brand-200), var(--brand-200), var(--nx-gold));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: brandGradient 5s ease infinite;
        }

        .auth-copy {
          margin-top: 22px;
          max-width: 620px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          line-height: 1.85;
        }

        /* ── Highlight cards ── */
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
          transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
          cursor: default;
        }

        .auth-highlight-card:hover {
          background: rgb(var(--brand-500-rgb) / 0.1);
          border-color: rgb(var(--brand-300-rgb) / 0.28);
          box-shadow: 0 0 20px rgb(var(--brand-500-rgb) / 0.15), inset 0 1px 0 rgba(255,255,255,0.06);
          transform: translateY(-2px);
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

        /* ── Feature cards ── */
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
          transition: background 220ms ease, border-color 220ms ease, transform 220ms ease;
        }

        .auth-feature-card:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgb(var(--brand-300-rgb) / 0.2);
          transform: translateY(-2px);
        }

        /* ── Feature icon with gradient bg ── */
        .auth-feature-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, rgb(var(--brand-500-rgb) / 0.22) 0%, rgb(var(--brand-300-rgb) / 0.12) 100%);
          color: var(--brand-100);
          border: 1px solid rgb(var(--brand-300-rgb) / 0.22);
          box-shadow: 0 4px 14px rgb(var(--brand-500-rgb) / 0.14), inset 0 1px 0 rgba(255,255,255,0.08);
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

        /* ── Auth panel (right glass card) ── */
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
          background: rgb(var(--brand-500-rgb) / 0.12);
          border: 1px solid rgb(var(--brand-300-rgb) / 0.18);
          color: var(--brand-100);
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
          color: var(--brand-200);
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

        /* ── Breakpoint: tablet landscape (768–1080px) ── */
        /* Show a compact two-column layout: showcase visible but condensed */
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

        /* ── Breakpoint: tablet portrait / large mobile (820px) ── */
        @media (max-width: 820px) {
          .auth-shell {
            background: linear-gradient(180deg, rgb(var(--nx-navy-deep-rgb) / 1) 0%, rgb(var(--nx-navy-deep-rgb) / 1) 100%);
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

          .auth-highlight-list {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .auth-feature-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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

        /* ── Breakpoint: small tablets / large phones (640px) ── */
        @media (max-width: 640px) {
          .auth-highlight-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* ── Breakpoint: mobile (≤560px) ── */
        @media (max-width: 560px) {
          .auth-showcase {
            display: none;
          }

          .auth-panel-photo {
            display: block;
            width: 100%;
            margin: 0 0 18px;
            aspect-ratio: 16 / 7;
            object-fit: cover;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          .auth-panel {
            max-width: none;
          }

          .auth-panel-copy h2 {
            font-size: 30px;
          }

          .auth-footer {
            align-items: flex-start;
          }
        }

        /* ── Breakpoint: extra small (≤375px) — prevent overflow ── */
        @media (max-width: 375px) {
          .auth-grid {
            padding: 12px 10px 20px;
            gap: 14px;
          }

          .auth-panel {
            padding: 18px 14px;
          }

          .auth-panel-copy h2 {
            font-size: 26px;
            letter-spacing: -0.5px;
          }

          .auth-panel-top {
            gap: 10px;
            margin-bottom: 18px;
            padding-bottom: 16px;
          }

          .auth-brand-mark-small {
            width: 36px;
            height: 36px;
          }

          .auth-panel-brand-name {
            font-size: 15px;
          }

          .auth-panel-brand-subtitle {
            font-size: 11px;
          }

          .auth-status-pill {
            font-size: 11px;
            padding: 6px 10px;
          }

          .auth-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .glass-input {
            font-size: 14px;
          }
        }

        /* ── Reduced motion: disable all animations for accessibility ── */
        @media (prefers-reduced-motion: reduce) {
          .auth-orb-primary,
          .auth-orb-secondary,
          .auth-orb-tertiary {
            animation: none;
          }

          .auth-brand-mark {
            animation: none;
          }

          .auth-title span {
            animation: none;
            background: linear-gradient(90deg, var(--brand-200), var(--nx-gold));
            background-size: 100% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .auth-highlight-card:hover,
          .auth-feature-card:hover {
            transform: none;
          }

          .anim-fadeup {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
