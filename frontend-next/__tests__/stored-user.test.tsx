import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { useStoredUser } from '@/lib/use-stored-user';

function Probe() {
  const user = useStoredUser();
  return createElement('span', null, user?.role ?? 'none');
}

describe('useStoredUser', () => {
  beforeEach(() => localStorage.setItem('user', JSON.stringify({ id: 'USR001', role: 'super_admin' })));

  it('renders the same markup as the server on the first render (no hydration mismatch)', () => {
    expect(renderToString(createElement(Probe))).toContain('none');
  });

  it('exposes the stored user after mount', async () => {
    const { result } = renderHook(() => useStoredUser());
    await waitFor(() => expect(result.current).toEqual({ id: 'USR001', role: 'super_admin' }));
  });

  it('tolerates missing or corrupt storage', async () => {
    localStorage.setItem('user', '{oops');
    const { result } = renderHook(() => useStoredUser());
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBeNull();
  });
});
