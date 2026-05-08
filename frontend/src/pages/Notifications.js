import React, { useState } from 'react';
import { notificationService } from '../services/api';
import { Bell, Send } from 'lucide-react';

const EMPTY_FORM = {
  channel: 'email',
  recipient: '',
  message: '',
  module: 'spp',
  entityId: '',
};

export default function Notifications() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState(null);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await notificationService.getConfig();
        setConfig(res.data || null);
      } catch (e) {
        setConfig({ error: e.response?.data?.error || 'Gagal memuat konfigurasi notifikasi.' });
      }
    };
    loadConfig();
  }, []);

  const handleSend = async () => {
    if (!form.recipient || !form.message || !form.channel) {
      setResult({ ok: false, message: 'Channel, penerima, dan pesan wajib diisi.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await notificationService.send({
        channels: [form.channel],
        to: form.channel === 'email' ? { email: form.recipient } : { phone: form.recipient },
        subject: form.module ? `Notifikasi ${form.module.toUpperCase()}` : 'Notifikasi NexFinance',
        message: form.message,
        metadata: {
          module: form.module,
          entityId: form.entityId || undefined,
        },
      });
      const sentCount = Array.isArray(res.data?.results) ? res.data.results.length : 0;
      setResult({ ok: true, message: sentCount > 0 ? `Notifikasi berhasil dikirim (${sentCount} channel).` : 'Notifikasi berhasil dikirim.' });
      setForm(EMPTY_FORM);
    } catch (e) {
      const apiErr = e.response?.data?.error || e.response?.data?.errors?.[0]?.error;
      setResult({ ok: false, message: apiErr || 'Gagal mengirim notifikasi. Silakan cek konfigurasi provider backend.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Notifikasi (Email & WhatsApp)</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Kirim notifikasi terintegrasi ke endpoint backend</p>
        </div>

        {result && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: result.ok ? '#D1FAE5' : '#FEE2E2', color: result.ok ? '#065F46' : '#991B1B', border: `1px solid ${result.ok ? '#A7F3D0' : '#FECACA'}`, fontSize: 13, fontWeight: 600 }}>
            {result.ok ? '✅' : '❌'} {result.message}
          </div>
        )}

        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--text-2)' }}>
            {config?.error ? (
              <span style={{ color: '#991B1B' }}>❌ {config.error}</span>
            ) : (
              <>
                Email: <strong>{config?.email?.enabled ? 'Aktif' : 'Belum dikonfigurasi'}</strong> · WA: <strong>{config?.whatsapp?.enabled ? 'Aktif' : 'Belum dikonfigurasi'}</strong>
              </>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Channel</label>
              <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Penerima (email/no WA)</label>
              <input className="input" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="user@mail.com / 62812xxxxxx" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Modul Terkait</label>
              <select className="input" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                <option value="spp">SPP</option>
                <option value="expenses">Expenses</option>
                <option value="payroll">Payroll</option>
                <option value="procurement">Procurement</option>
                <option value="accounting">Accounting</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Entity ID (opsional)</label>
              <input className="input" value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} placeholder="INV001 / EXP009 / ..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Pesan</label>
              <textarea className="input" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tulis pesan notifikasi..." style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSend} disabled={submitting}>
              <Send size={15} /> {submitting ? 'Mengirim...' : 'Kirim Notifikasi'}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={16} color="var(--teal)" />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Jika endpoint backend belum tersedia, UI akan menampilkan error yang jelas tanpa crash.
          </span>
        </div>
      </div>
    </div>
  );
}
