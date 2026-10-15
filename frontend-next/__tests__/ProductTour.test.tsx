import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TourProvider, useTour } from '@/components/tour/TourProvider';
import { hasCompletedTour, type TourStep } from '@/lib/tour';

const STEPS: TourStep[] = [
  { id: 'intro', title: 'Selamat datang', body: 'Ini adalah langkah pembuka tur.' },
  { id: 'nav', title: 'Navigasi modul', body: 'Gunakan menu ini untuk berpindah modul.', target: '[data-tour="nav"]', area: 'sidebar' },
  { id: 'missing', title: 'Target hilang', body: 'Target tidak ada, tetap tampil di tengah.', target: '[data-tour="ghost"]' },
];

function StartButton() {
  const { startTour, active } = useTour();
  return <button onClick={startTour}>{active ? 'tur aktif' : 'mulai manual'}</button>;
}

function renderTour(props: Partial<React.ComponentProps<typeof TourProvider>> = {}) {
  // jsdom has no layout: give the visible tour target a real box.
  const realRect = Element.prototype.getBoundingClientRect;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.getAttribute('data-tour') === 'nav'
      ? DOMRect.fromRect({ x: 16, y: 120, width: 232, height: 400 })
      : realRect.call(this);
  });
  return render(
    <TourProvider steps={STEPS} autoStart={false} {...props}>
      <nav data-tour="nav">Menu</nav>
      <StartButton />
    </TourProvider>,
  );
}

describe('TourProvider + ProductTour', () => {
  it('walks through every step and stores completion', async () => {
    const user = userEvent.setup();
    renderTour();
    await user.click(screen.getByRole('button', { name: 'mulai manual' }));

    const dialog = screen.getByRole('dialog', { name: 'Selamat datang' });
    expect(dialog).toHaveTextContent('Langkah 1 dari 3');
    expect(screen.getByRole('button', { name: 'Kembali' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('dialog', { name: 'Navigasi modul' })).toHaveTextContent('Langkah 2 dari 3');
    expect(document.querySelector('[data-tour-spotlight]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('dialog', { name: 'Target hilang' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Selesai' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasCompletedTour(window.localStorage)).toBe(true);
  });

  it('supports keyboard navigation and Escape to skip', async () => {
    renderTour();
    fireEvent.click(screen.getByRole('button', { name: 'mulai manual' }));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: 'Navigasi modul' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByRole('dialog', { name: 'Selamat datang' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasCompletedTour(window.localStorage)).toBe(true);
  });

  it('asks to open the sidebar for sidebar steps on small screens', async () => {
    const onSidebarRequest = vi.fn();
    const original = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
    try {
      renderTour({ onSidebarRequest });
      fireEvent.click(screen.getByRole('button', { name: 'mulai manual' }));
      fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
      expect(onSidebarRequest).toHaveBeenLastCalledWith(true);
      fireEvent.click(screen.getByRole('button', { name: 'Lewati tur' }));
      expect(onSidebarRequest).toHaveBeenLastCalledWith(false);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: original });
    }
  });

  it('greets first-time users with a welcome dialog', async () => {
    vi.useFakeTimers();
    try {
      renderTour({ autoStart: true });
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(screen.getByRole('dialog', { name: /Selamat datang di NexFinance/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Mulai tur' }));
      expect(screen.getByRole('dialog', { name: 'Selamat datang' })).toHaveTextContent('Langkah 1 dari 3');
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets users postpone the welcome tour without nagging again', async () => {
    vi.useFakeTimers();
    try {
      renderTour({ autoStart: true });
      await act(async () => { vi.advanceTimersByTime(1000); });
      fireEvent.click(screen.getByRole('button', { name: 'Nanti saja' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(hasCompletedTour(window.localStorage)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not greet returning users', async () => {
    window.localStorage.setItem('nexfinance.tour.v1', 'done');
    vi.useFakeTimers();
    try {
      renderTour({ autoStart: true });
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
