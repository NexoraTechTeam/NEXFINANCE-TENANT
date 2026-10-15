'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, Compass, HelpCircle, LifeBuoy, X } from 'lucide-react';
import { useTour } from '@/components/tour/TourProvider';
import { getModuleGuide } from '@/lib/help-content';

/** Floating "?" button with tips for the current page plus shortcuts to the tour and help hub. */
export default function HelpLauncher() {
  const router = useRouter();
  const pathname = usePathname();
  const { startTour } = useTour();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const guide = getModuleGuide(pathname || '/dashboard');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="help-launcher">
      {open && (
        <div id="nf-help-panel" role="dialog" aria-label="Bantuan cepat" className="help-launcher-panel">
          <div className="help-launcher-head">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="nx-eyebrow" style={{ color: 'var(--nx-gold)' }}>
                <LifeBuoy size={13} strokeWidth={2.2} /> Bantuan halaman ini
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup bantuan"
                className="hamburger-btn"
                style={{ padding: 4 }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6, letterSpacing: '-0.3px' }}>{guide.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.74)', marginTop: 4, lineHeight: 1.5 }}>{guide.summary}</div>
          </div>
          <div className="help-launcher-body">
            <ol className="help-tip-list">
              {guide.steps.map((step, i) => (
                <li key={step}><span className="help-step-num">{i + 1}</span><span>{step}</span></li>
              ))}
            </ol>
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                type="button"
                className="help-action"
                onClick={() => { setOpen(false); startTour(); }}
              >
                <span className="help-action-icon"><Compass size={16} strokeWidth={2} /></span>
                Mulai tur aplikasi
              </button>
              <button type="button" className="help-action" onClick={() => go('/dashboard/help')}>
                <span className="help-action-icon"><BookOpenCheck size={16} strokeWidth={2} /></span>
                Buka Pusat Bantuan
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        data-tour="help-launcher"
        className="help-launcher-btn"
        aria-label="Bantuan cepat"
        aria-expanded={open}
        aria-controls={open ? 'nf-help-panel' : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} strokeWidth={2.2} /> : <HelpCircle size={24} strokeWidth={2} />}
      </button>
    </div>
  );
}
