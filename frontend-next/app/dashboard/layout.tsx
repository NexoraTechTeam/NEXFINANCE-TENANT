'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TenantMark from '@/components/tenant/TenantMark';
import { useTenant } from '@/components/tenant/TenantProvider';
import { brandLines } from '@/lib/tenant';
import HelpLauncher from '@/components/help/HelpLauncher';
import ForcePasswordChange from '@/components/auth/ForcePasswordChange';
import AccessGate from '@/components/auth/AccessGate';
import { TourProvider } from '@/components/tour/TourProvider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const brand = brandLines(useTenant());
  const pageLabel =
    pathname === '/dashboard'
      ? 'Executive Overview'
      : pathname === '/dashboard/help'
      ? 'Pusat Bantuan'
      : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard';

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar overlay is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <TourProvider onSidebarRequest={setSidebarOpen}>
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column' }}>
      {/* Mobile top header — hidden on desktop via CSS */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <TenantMark size={30} />
          <span style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
            }}>
              {brand.title}
            </span>
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.54)',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {pageLabel}
            </span>
          </span>
        </div>
        <div style={{
          padding: '8px 10px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.74)',
          whiteSpace: 'nowrap',
        }}>
          Live
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Overlay — shown behind sidebar on mobile */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="dashboard-main" data-tour="content">
          <AccessGate>{children}</AccessGate>
        </main>
      </div>

      <HelpLauncher />
      <ForcePasswordChange />
    </div>
    </TourProvider>
  );
}
