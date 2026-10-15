import { describe, expect, it } from 'vitest';
import {
  APP_TOUR_STEPS,
  TOUR_STORAGE_KEY,
  hasCompletedTour,
  initialTourState,
  markTourCompleted,
  resetTourCompletion,
  tourReducer,
} from '@/lib/tour';
import { FAQS, MODULE_GUIDES, getModuleGuide, searchFaqs } from '@/lib/help-content';

describe('app tour steps', () => {
  it('has a meaningful, uniquely identified sequence of steps', () => {
    expect(APP_TOUR_STEPS.length).toBeGreaterThanOrEqual(6);
    const ids = APP_TOUR_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const step of APP_TOUR_STEPS) {
      expect(step.title.length).toBeGreaterThan(3);
      expect(step.body.length).toBeGreaterThan(10);
    }
  });

  it('targets data-tour anchors (or is a centered intro/outro)', () => {
    for (const step of APP_TOUR_STEPS) {
      if (step.target) expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
    }
    expect(APP_TOUR_STEPS.some((step) => step.target === '[data-tour="help-menu"]')).toBe(true);
  });
});

describe('tourReducer', () => {
  const total = 3;

  it('starts at the first step', () => {
    const state = tourReducer(initialTourState, { type: 'start', total });
    expect(state).toMatchObject({ active: true, index: 0, total });
  });

  it('moves forward and backward within bounds', () => {
    let state = tourReducer(initialTourState, { type: 'start', total });
    state = tourReducer(state, { type: 'prev' });
    expect(state.index).toBe(0);
    state = tourReducer(state, { type: 'next' });
    expect(state.index).toBe(1);
    state = tourReducer(state, { type: 'prev' });
    expect(state.index).toBe(0);
  });

  it('finishes after the last step', () => {
    let state = tourReducer(initialTourState, { type: 'start', total });
    state = tourReducer(state, { type: 'next' });
    state = tourReducer(state, { type: 'next' });
    expect(state).toMatchObject({ active: true, index: 2 });
    state = tourReducer(state, { type: 'next' });
    expect(state).toMatchObject({ active: false, completed: true });
  });

  it('can be skipped at any point', () => {
    let state = tourReducer(initialTourState, { type: 'start', total });
    state = tourReducer(state, { type: 'skip' });
    expect(state).toMatchObject({ active: false, completed: true });
  });

  it('can jump to a specific step', () => {
    let state = tourReducer(initialTourState, { type: 'start', total });
    state = tourReducer(state, { type: 'goto', index: 2 });
    expect(state.index).toBe(2);
    state = tourReducer(state, { type: 'goto', index: 99 });
    expect(state.index).toBe(2);
  });
});

describe('tour persistence', () => {
  it('records completion in storage', () => {
    expect(hasCompletedTour(window.localStorage)).toBe(false);
    markTourCompleted(window.localStorage);
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).not.toBeNull();
    expect(hasCompletedTour(window.localStorage)).toBe(true);
    resetTourCompletion(window.localStorage);
    expect(hasCompletedTour(window.localStorage)).toBe(false);
  });

  it('never throws when storage is unavailable', () => {
    const broken = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    expect(hasCompletedTour(broken)).toBe(true);
    expect(() => markTourCompleted(broken)).not.toThrow();
    expect(() => resetTourCompletion(broken)).not.toThrow();
    expect(hasCompletedTour(undefined)).toBe(true);
  });
});

describe('help content', () => {
  it('provides a guide for every main module', () => {
    const hrefs = MODULE_GUIDES.map((guide) => guide.href);
    for (const href of [
      '/dashboard', '/dashboard/spp', '/dashboard/payroll', '/dashboard/expenses',
      '/dashboard/procurement', '/dashboard/accounting', '/dashboard/reports',
      '/dashboard/activity-logs', '/dashboard/master/students',
      '/dashboard/master/employees', '/dashboard/master/access',
    ]) {
      expect(hrefs).toContain(href);
    }
    for (const guide of MODULE_GUIDES) expect(guide.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('resolves the guide for the current route, including nested routes', () => {
    expect(getModuleGuide('/dashboard/spp').href).toBe('/dashboard/spp');
    expect(getModuleGuide('/dashboard/master/students').href).toBe('/dashboard/master/students');
    expect(getModuleGuide('/dashboard').href).toBe('/dashboard');
    expect(getModuleGuide('/dashboard/unknown-page').href).toBe('/dashboard');
  });

  it('filters FAQs case-insensitively on question and answer', () => {
    expect(searchFaqs('')).toHaveLength(FAQS.length);
    const hits = searchFaqs('PASSWORD');
    expect(hits.length).toBeGreaterThan(0);
    for (const faq of hits) {
      expect(`${faq.question} ${faq.answer}`.toLowerCase()).toContain('password');
    }
    expect(searchFaqs('zzz-tidak-ada')).toHaveLength(0);
  });
});
