'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass } from 'lucide-react';
import type { TourStep } from '@/lib/tour';

interface ProductTourProps {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** Eyebrow label, e.g. "Tur aplikasi" or "Tur halaman". */
  label?: string;
}

interface Rect { top: number; left: number; width: number; height: number }

const SPOTLIGHT_PADDING = 6;
const POPOVER_GAP = 14;
const POPOVER_WIDTH = 360;
const VIEWPORT_MARGIN = 12;
// The sidebar drawer slides in over 240ms on mobile; re-measure once it settles.
const SETTLE_DELAY_MS = 280;

function measure(selector?: string): Rect | null {
  if (!selector || typeof document === 'undefined') return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return {
    top: box.top - SPOTLIGHT_PADDING,
    left: box.left - SPOTLIGHT_PADDING,
    width: box.width + SPOTLIGHT_PADDING * 2,
    height: box.height + SPOTLIGHT_PADDING * 2,
  };
}

function popoverPosition(rect: Rect): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(POPOVER_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const clampLeft = (left: number) => Math.min(Math.max(VIEWPORT_MARGIN, left), vw - width - VIEWPORT_MARGIN);
  const clampTop = (top: number) => Math.min(Math.max(VIEWPORT_MARGIN, top), vh - 260);

  // Right of the target (sidebar items).
  if (rect.left + rect.width + POPOVER_GAP + width <= vw - VIEWPORT_MARGIN) {
    return { left: rect.left + rect.width + POPOVER_GAP, top: clampTop(rect.top) };
  }
  // Left of the target (floating launcher).
  if (rect.left - POPOVER_GAP - width >= VIEWPORT_MARGIN && rect.height < vh / 2) {
    return { left: rect.left - POPOVER_GAP - width, top: clampTop(rect.top + rect.height - 220) };
  }
  // Below, otherwise above, otherwise pinned inside the target (large content areas).
  if (rect.top + rect.height + POPOVER_GAP + 220 <= vh) {
    return { left: clampLeft(rect.left), top: rect.top + rect.height + POPOVER_GAP };
  }
  if (rect.top - POPOVER_GAP - 220 >= 0) {
    return { left: clampLeft(rect.left), top: rect.top - POPOVER_GAP - 220 };
  }
  return { left: clampLeft(rect.left + 24), top: clampTop(Math.max(rect.top, 0) + 24) };
}

export default function ProductTour({ step, index, total, onNext, onPrev, onSkip, label = 'Tur aplikasi' }: ProductTourProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const isLast = index === total - 1;
  const titleId = `nf-tour-title-${step.id}`;
  const bodyId = `nf-tour-body-${step.id}`;

  const update = useCallback(() => setRect(measure(step.target)), [step.target]);

  useLayoutEffect(() => {
    const el = step.target ? document.querySelector(step.target) : null;
    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    update();
    const settle = window.setTimeout(update, SETTLE_DELAY_MS);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step.target, update]);

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [step.id]);

  const centered = !rect;
  const style: CSSProperties = rect ? popoverPosition(rect) : {};

  return (
    <>
      <div className={`tour-blocker ${centered ? 'tour-blocker-dim' : ''}`} aria-hidden="true" />
      {rect && (
        <div
          data-tour-spotlight=""
          className="tour-spotlight"
          aria-hidden="true"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={`tour-popover ${centered ? 'tour-popover-centered' : ''}`}
        style={style}
      >
        <div className="tour-popover-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="nx-eyebrow">
              <Compass size={13} strokeWidth={2.2} /> {label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)' }}>
              Langkah {index + 1} dari {total}
            </span>
          </div>
          <h2 id={titleId} className="tour-popover-title">{step.title}</h2>
          <p id={bodyId} className="tour-popover-text">{step.body}</p>
          <div className="tour-progress" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} data-done={i < index} data-current={i === index} />
            ))}
          </div>
        </div>
        <div className="tour-footer">
          <button type="button" className="tour-btn tour-btn-link" onClick={onSkip}>
            Lewati tur
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="tour-btn" onClick={onPrev} disabled={index === 0}>
              <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" /> Kembali
            </button>
            <button ref={primaryRef} type="button" className="tour-btn tour-btn-primary" onClick={onNext}>
              {isLast ? (
                <><Check size={14} strokeWidth={2.4} aria-hidden="true" /> Selesai</>
              ) : (
                <>Lanjut <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
