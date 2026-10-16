'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import BrandMark, { NexoraLogo } from '@/components/brand/BrandMark';
import { CONSOLE_TOKEN_KEY, consoleApi, consoleError } from '@/lib/console-api';

/** Operator sign-in gate + shell for the Nexora console. */
export default function ConsoleGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(window.localStorage.getItem(CONSOLE_TOKEN_KEY)));
    setReady(true);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await consoleApi.login(form.email, form.password);
      window.localStorage.setItem(CONSOLE_TOKEN_KEY, token);
      setAuthed(true);
    } catch (err) {
      setError(consoleError(err, 'Login gagal.'));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    window.localStorage.removeItem(CONSOLE_TOKEN_KEY);
    setAuthed(false);
  };

  if (!ready) return null;

  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: 'linear-gradient(135deg, var(--nx-navy) 0%, var(--brand-800) 60%, var(--nx-navy-deep) 100%)' }}>
        <form onSubmit={submit} className="card" style={{ width: 'min(400px, 100%)', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <BrandMark size={40} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>NexFinance Console</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Khusus operator Nexora</div>
            </div>
          </div>
          <label className="form-label" htmlFor="console-email">Email</label>
          <input id="console-email" type="email" className="form-input" autoComplete="username" required
            value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <label className="form-label" htmlFor="console-password" style={{ marginTop: 12 }}>Password</label>
          <input id="console-password" type="password" className="form-input" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          {error && <div role="alert" style={{ marginTop: 12, color: '#991b1b', fontSize: 13 }}>{error}</div>}
          <button type="submit" className="btn-teal" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}><NexoraLogo height={18} /></div>
        </form>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--nx-navy)', color: '#fff', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <a href="/console" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={32} />
            <span style={{ fontWeight: 800 }}>NexFinance Console</span>
            <span className="nx-eyebrow" style={{ color: 'var(--nx-gold)' }}><ShieldCheck size={12} /> Operator</span>
          </a>
          <button type="button" className="hamburger-btn" onClick={logout} style={{ gap: 6, fontSize: 13, fontWeight: 700 }}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
        <div className="nx-brand-bar" style={{ borderRadius: 0 }} aria-hidden="true" />
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 48px' }}>{children}</main>
    </div>
  );
}
