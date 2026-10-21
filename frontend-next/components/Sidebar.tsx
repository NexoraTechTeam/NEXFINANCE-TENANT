'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, DollarSign,
  ShoppingCart, BookOpen, FileText, LogOut, Sparkles, X, UserCog, UserRound, ClipboardList, History, KeyRound,
  LifeBuoy,
} from 'lucide-react';
import { authService } from '@/lib/api';
import Attribution from '@/components/brand/Attribution';
import TenantMark from '@/components/tenant/TenantMark';
import { useTenant } from '@/components/tenant/TenantProvider';
import { brandLines } from '@/lib/tenant';

const NAV = [
  { label: 'Dashboard',       icon: LayoutDashboard, href: '/dashboard' },
  { label: 'SPP',             icon: CreditCard,      href: '/dashboard/spp' },
  { label: 'Penggajian',      icon: Users,           href: '/dashboard/payroll' },
  { label: 'Pengeluaran',     icon: DollarSign,      href: '/dashboard/expenses' },
  { label: 'Pengadaan',       icon: ShoppingCart,    href: '/dashboard/procurement' },
  { label: 'Akuntansi',       icon: BookOpen,        href: '/dashboard/accounting' },
  { label: 'Laporan',         icon: FileText,        href: '/dashboard/reports' },
  { label: 'Log Historis',    icon: History,         href: '/dashboard/activity-logs' },
  { label: 'Master Siswa',    icon: UserRound,       href: '/dashboard/master/students' },
  { label: 'Master Karyawan', icon: ClipboardList,   href: '/dashboard/master/employees' },
  { label: 'Role & Akses',    icon: UserCog,         href: '/dashboard/master/access' },
];

const HELP_NAV = { label: 'Bantuan', icon: LifeBuoy, href: '/dashboard/help' };

const PASSWORD_SUCCESS_MESSAGE = 'Password berhasil diubah.';

function getPasswordErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string') {
      return response.data.error === 'Current password is incorrect'
        ? 'Password saat ini salah.'
        : response.data.error;
    }
  }

  return 'Gagal mengubah password.';
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const tenant = useTenant();
  const brand = brandLines(tenant);
  const [currentUser, setCurrentUser] = useState({ name: 'Administrator', role: 'Super Admin' });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;

    try {
      const parsed = JSON.parse(rawUser) as { name?: string; email?: string; role?: string };
      setCurrentUser({
        name: parsed.name || parsed.email || 'Administrator',
        role: parsed.role || 'Super Admin',
      });
    } catch {
      setCurrentUser({ name: 'Administrator', role: 'Super Admin' });
    }
  }, []);

  const activeSection = useMemo(
    () => [...NAV, HELP_NAV].find(({ href }) => pathname === href)?.label || 'Dashboard',
    [pathname]
  );

  const initials = useMemo(() => {
    const source = currentUser.name.trim();
    if (!source) return 'NF';
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'NF';
  }, [currentUser.name]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordMessage('');
    try {
      await authService.changePassword(passwords);
      setPasswordMessage(PASSWORD_SUCCESS_MESSAGE);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      setPasswordMessage(getPasswordErrorMessage(error));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <aside
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px 16px',
      }}
    >
      <div className="nx-brand-bar" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0 }} />

      {/* ── Logo / brand area ── */}
      <div style={{
        padding: '6px 8px 18px',
        marginBottom: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        /* subtle gradient accent at bottom of logo area */
        background: 'linear-gradient(180deg, rgb(var(--brand-500-rgb) / 0.08) 0%, transparent 100%)',
        borderRadius: '12px 12px 0 0',
        marginInline: -4,
        paddingInline: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* School logo (or NexFinance mark) — pulses subtly */}
            <span className="nf-badge-pulse" style={{ display: 'inline-flex', borderRadius: '50%', flexShrink: 0 }}>
              <TenantMark size={40} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {brand.title}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                {brand.subtitle}
              </div>
            </div>
          </div>

          {/* Close button — mobile only via CSS */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="Close navigation"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div data-tour="brand" className="sidebar-workspace" style={{
          marginTop: 16,
          padding: '12px 12px 14px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgb(var(--brand-500-rgb) / 0.22) 0%, rgb(var(--nx-purple-rgb) / 0.10) 100%)',
          border: '1px solid rgb(var(--brand-300-rgb) / 0.18)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--nx-gold)',
            letterSpacing: '.35px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <Sparkles size={12} strokeWidth={2} />
            Active workspace
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            {activeSection}
          </div>
          <div className="sidebar-workspace-desc" style={{ color: 'rgba(255,255,255,0.52)', fontSize: 12, marginTop: 4 }}>
            Ringkas, cepat, dan siap dipakai di desktop maupun mobile.
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav data-tour="nav" aria-label="Menu utama" style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {/* Active dot indicator */}
              {active && (
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--nx-gold)',
                  flexShrink: 0,
                  boxShadow: '0 0 8px rgb(var(--nx-gold-rgb) / 0.65)',
                }} />
              )}
            </button>
          );
        })}

      </nav>

      {/* ── Support — kept outside the scrolling nav so it is always visible ── */}
      <div style={{ flexShrink: 0, paddingTop: 8, marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          margin: '6px 14px 4px',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.38)',
        }}>
          Dukungan
        </div>
        <button
          type="button"
          data-tour="help-menu"
          onClick={() => handleNav(HELP_NAV.href)}
          className={`nav-link ${pathname === HELP_NAV.href ? 'nav-link-active' : ''}`}
          aria-current={pathname === HELP_NAV.href ? 'page' : undefined}
        >
          <HELP_NAV.icon size={18} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>{HELP_NAV.label}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 999,
            color: 'var(--nx-navy)',
            background: 'var(--nx-gold)',
          }}>
            Panduan
          </span>
        </button>
      </div>

      {/* ── User profile ── */}
      <div data-tour="profile" style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 14,
        marginTop: 8,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          marginBottom: 10,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Avatar */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgb(var(--brand-500-rgb) / 0.55) 0%, rgb(var(--brand-600-rgb) / 0.55) 100%)',
            border: '1.5px solid rgb(var(--brand-500-rgb) / 0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentUser.name}
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.40)',
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentUser.role}
            </div>
          </div>
        </div>

        <button type="button" onClick={() => setPasswordOpen((open) => !open)} className="nav-link" aria-expanded={passwordOpen}>
          <KeyRound size={18} strokeWidth={1.8} />
          Ubah password
        </button>
        {passwordOpen && (
          <form onSubmit={handlePasswordChange} style={{ padding: '10px 8px' }}>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <input key={field} required minLength={field === 'currentPassword' ? 1 : 8} type="password" placeholder={field === 'currentPassword' ? 'Password saat ini' : field === 'newPassword' ? 'Password baru' : 'Konfirmasi password'} value={passwords[field as keyof typeof passwords]} onChange={(event) => setPasswords((prev) => ({ ...prev, [field]: event.target.value }))} style={{ width: '100%', marginBottom: 7, padding: '8px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.08)', color: '#fff' }} />
            ))}
            {passwordMessage && <div style={{ color: passwordMessage === PASSWORD_SUCCESS_MESSAGE ? 'var(--brand-100)' : '#ffaaaa', fontSize: 11, marginBottom: 7 }}>{passwordMessage}</div>}
            <button type="submit" disabled={passwordBusy} className="nav-link" style={{ color: 'var(--brand-100)' }}>{passwordBusy ? 'Menyimpan...' : 'Simpan password'}</button>
          </form>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-link"
          style={{ color: 'rgba(255,110,110,0.80)' }}
          aria-label="Keluar dari aplikasi"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Keluar
        </button>

        {tenant.showPoweredBy && <Attribution className="sidebar-powered" html={tenant.poweredByText} logoHeight={16} />}
      </div>
    </aside>
  );
}
