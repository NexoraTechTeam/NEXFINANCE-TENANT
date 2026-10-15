import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

const push = vi.fn();
let pathname = '/dashboard/spp';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

import HelpLauncher from '@/components/help/HelpLauncher';
import { TourProvider } from '@/components/tour/TourProvider';
import { getPageTour, resolveTourSteps } from '@/lib/page-tours';
import { MODULE_GUIDES } from '@/lib/help-content';
import { hasCompletedTour, type TourStep } from '@/lib/tour';

beforeEach(() => {
  pathname = '/dashboard/spp';
  document.body.innerHTML = '';
});

describe('getPageTour', () => {
  it('builds a tour for every module, opening with a centered intro', () => {
    for (const guide of MODULE_GUIDES) {
      const steps = getPageTour(guide.href);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps[0].target).toBeUndefined();
      expect(steps[0].title).toContain(guide.title);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    }
  });

  it('highlights module-specific regions', () => {
    const dashboard = getPageTour('/dashboard').map((s) => s.target).join(' ');
    expect(dashboard).toContain('.kpi-grid');
    expect(dashboard).toContain('.charts-row');
    const spp = getPageTour('/dashboard/spp').map((s) => s.target).join(' ');
    expect(spp).toContain('.page-header');
    expect(spp).toContain('.table-wrapper');
  });

  it('falls back to the dashboard tour for unknown routes', () => {
    expect(getPageTour('/dashboard/unknown')[0].title).toContain('Dashboard');
  });
});

describe('resolveTourSteps', () => {
  it('drops steps whose target is missing but keeps centered steps', () => {
    document.body.innerHTML = '<div class="present"></div>';
    const steps: TourStep[] = [
      { id: 'a', title: 'Intro', body: 'Centered intro step.' },
      { id: 'b', title: 'Ada', body: 'Target present in DOM.', target: '.present' },
      { id: 'c', title: 'Tidak ada', body: 'Target missing in DOM.', target: '.missing' },
    ];
    expect(resolveTourSteps(steps, document).map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('page tour from the help launcher', () => {
  it('runs a page tour for the current route without marking the app tour done', () => {
    render(
      <TourProvider autoStart={false}>
        <div className="page-header">Header</div>
        <HelpLauncher />
      </TourProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Bantuan cepat/i }));
    const panel = screen.getByRole('dialog', { name: /Bantuan cepat/i });
    fireEvent.click(within(panel).getByRole('button', { name: /Tur halaman ini/i }));

    const intro = screen.getByRole('dialog', { name: /Manajemen SPP/ });
    // Only the intro + the present header (+ centered outro) survive resolution.
    expect(intro).toHaveTextContent(/Langkah 1 dari 3/);
    expect(intro).toHaveTextContent(/Tur halaman/);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Manajemen SPP/ })).not.toBeInTheDocument();
    expect(hasCompletedTour(window.localStorage)).toBe(false);
  });
});
