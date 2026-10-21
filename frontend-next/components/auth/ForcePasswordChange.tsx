'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { authService } from '@/lib/api';

const readUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null') as { mustChangePassword?: boolean } | null;
  } catch {
    return null;
  }
};

const apiError = (error: unknown) => {
  const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof msg === 'string' ? msg : 'Gagal mengubah password. Coba lagi.';
};

/** Blocking dialog shown after logging in with a temporary password (first login / reset). */
export default function ForcePasswordChange() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOpen(Boolean(readUser()?.mustChangePassword));
  }, []);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('Password baru minimal 8 karakter.');
    if (form.newPassword !== form.confirmPassword) return setError('Konfirmasi password tidak sama.');
    if (form.newPassword === form.currentPassword) return setError('Password baru harus berbeda dari password sementara.');
    setBusy(true);
    try {
      await authService.changePassword(form);
      const user = readUser() || {};
      window.localStorage.setItem('user', JSON.stringify({ ...user, mustChangePassword: false }));
      setOpen(false);
      window.dispatchEvent(new Event('nexfin:password-changed'));
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={`fpc-${key}`} className="form-label">{label}</label>
      <input
        id={`fpc-${key}`}
        type="password"
        className="form-input"
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <form
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fpc-title"
        onSubmit={submit}
        style={{ maxWidth: 440 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="help-guide-icon"><KeyRound size={18} strokeWidth={2} /></span>
          <h2 id="fpc-title" style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>Ganti password sementara</h2>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.55 }}>
          Demi keamanan, buat password baru sebelum mulai memakai aplikasi. Password sementara hanya berlaku untuk login pertama.
        </p>
        {field('currentPassword', 'Password sementara', 'current-password')}
        {field('newPassword', 'Password baru', 'new-password')}
        {field('confirmPassword', 'Ulangi password baru', 'new-password')}
        {error && (
          <div role="alert" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>
            {error}
          </div>
        )}
        <button type="submit" className="btn-teal" disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan password'}
        </button>
      </form>
    </div>
  );
}
