import { describe, expect, it } from 'vitest';
import { shouldRedirectToLogin } from '@/lib/api';

// Regression guard: the UI refresh must not change auth behaviour.
describe('shouldRedirectToLogin', () => {
  it('redirects on 401 for regular API calls', () => {
    expect(shouldRedirectToLogin(401, '/dashboard/kpi')).toBe(true);
  });

  it('does not redirect on credential endpoints or non-401 errors', () => {
    expect(shouldRedirectToLogin(401, '/auth/login')).toBe(false);
    expect(shouldRedirectToLogin(401, '/auth/change-password')).toBe(false);
    expect(shouldRedirectToLogin(403, '/dashboard/kpi')).toBe(false);
    expect(shouldRedirectToLogin(undefined, '/dashboard/kpi')).toBe(false);
  });
});
