'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ChevronDown, Compass, ExternalLink, Keyboard, LifeBuoy, Search, ShieldCheck,
} from 'lucide-react';
import { useTour } from '@/components/tour/TourProvider';
import { GUIDE_ICONS } from '@/components/help/guide-icons';
import { MODULE_GUIDES, SHORTCUTS, searchFaqs } from '@/lib/help-content';

export default function HelpCenter() {
  const router = useRouter();
  const { startTour } = useTour();
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqs = useMemo(() => searchFaqs(query), [query]);
  const guides = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return MODULE_GUIDES;
    return MODULE_GUIDES.filter((guide) =>
      `${guide.title} ${guide.summary} ${guide.steps.join(' ')}`.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <div className="anim-fadeup">
      <section className="help-hero" aria-labelledby="help-title">
        <span className="nx-eyebrow" style={{ color: 'var(--nx-gold)' }}>
          <LifeBuoy size={13} strokeWidth={2.2} /> Bantuan &amp; Panduan
        </span>
        <h1 id="help-title" style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.6px', marginTop: 8, lineHeight: 1.15 }}>
          Pusat Bantuan NexFinance
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', marginTop: 8, maxWidth: 620 }}>
          Temukan panduan langkah demi langkah untuk setiap modul, jawaban atas pertanyaan umum,
          atau ulangi tur aplikasi kapan saja.
        </p>

        <div className="help-search" role="search">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            aria-label="Cari bantuan"
            placeholder="Cari panduan atau pertanyaan, mis. “password”, “invoice”…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <button type="button" className="help-cta-gold" onClick={startTour}>
            <Compass size={16} strokeWidth={2.2} /> Mulai tur aplikasi
          </button>
          <a className="help-cta-ghost" href="/docs/nexfinance-export-guidance.pdf" target="_blank" rel="noreferrer">
            <ExternalLink size={16} strokeWidth={2} /> Panduan ekspor PDF
          </a>
        </div>
      </section>

      <section aria-labelledby="help-guides" className="section-gap">
        <h2 id="help-guides" className="help-section-title">Panduan per modul</h2>
        {guides.length === 0 ? (
          <div className="card" style={{ padding: 18, fontSize: 14, color: 'var(--text-3)' }}>
            Tidak ada panduan modul yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="help-guide-grid">
            {guides.map((guide) => {
              const Icon = GUIDE_ICONS[guide.key];
              return (
                <article key={guide.href} className="card card-hover help-guide-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="help-guide-icon"><Icon size={19} strokeWidth={1.9} /></span>
                    <h3>{guide.title}</h3>
                  </div>
                  <p>{guide.summary}</p>
                  <ol className="help-tip-list">
                    {guide.steps.map((step, i) => (
                      <li key={step}><span className="help-step-num">{i + 1}</span><span>{step}</span></li>
                    ))}
                  </ol>
                  <button type="button" className="help-link" onClick={() => router.push(guide.href)}>
                    Buka {guide.title} <ArrowRight size={14} strokeWidth={2.2} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="help-columns">
        <section aria-labelledby="help-faq" className="card" style={{ overflow: 'hidden' }}>
          <h2 id="help-faq" className="help-section-title" style={{ padding: '18px 18px 0', marginBottom: 6 }}>
            Pertanyaan Umum
          </h2>
          <div>
            {faqs.length === 0 ? (
              <p style={{ padding: '10px 18px 18px', fontSize: 14, color: 'var(--text-3)' }}>
                Tidak ada hasil untuk “{query}”. Coba kata kunci lain.
              </p>
            ) : faqs.map((faq) => {
              const open = openFaq === faq.question;
              const panelId = `faq-${faq.question.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
              return (
                <div key={faq.question} className="faq-item">
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(open ? null : faq.question)}
                  >
                    <span><span className="faq-tag">{faq.category}</span>{faq.question}</span>
                    <ChevronDown size={17} strokeWidth={2} aria-hidden="true" />
                  </button>
                  {open && <div id={panelId} className="faq-a">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <aside style={{ display: 'grid', gap: 16 }}>
          <section aria-labelledby="help-shortcuts" className="card" style={{ padding: 18 }}>
            <h2 id="help-shortcuts" className="help-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Keyboard size={18} strokeWidth={2} style={{ color: 'var(--brand-600)' }} /> Pintasan keyboard
            </h2>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 10 }}>
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.description} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-2)' }}>
                  <span style={{ display: 'inline-flex', gap: 4, minWidth: 52 }}>
                    {shortcut.keys.map((key) => <kbd key={key} className="kbd">{key}</kbd>)}
                  </span>
                  {shortcut.description}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="help-support" className="card" style={{ padding: 18 }}>
            <h2 id="help-support" className="help-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} strokeWidth={2} style={{ color: 'var(--nx-purple)' }} /> Butuh akses atau bantuan lain?
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Hak akses setiap menu diatur oleh Super Admin melalui <strong>Role &amp; Akses</strong>.
              Hubungi administrator sekolah bila Anda memerlukan izin tambahan atau menemukan kendala data.
            </p>
            <div className="nx-brand-bar" style={{ marginTop: 14 }} aria-hidden="true" />
          </section>
        </aside>
      </div>
    </div>
  );
}
