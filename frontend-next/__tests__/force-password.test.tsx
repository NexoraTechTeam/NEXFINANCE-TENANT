import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const changePassword = vi.fn();
vi.mock('@/lib/api', () => ({ authService: { changePassword: (...args: unknown[]) => changePassword(...args) } }));

import ForcePasswordChange from '@/components/auth/ForcePasswordChange';

beforeEach(() => {
  changePassword.mockReset();
  window.localStorage.setItem('user', JSON.stringify({ username: 'admin-almusabbihin', mustChangePassword: true }));
});

describe('ForcePasswordChange', () => {
  it('blocks the app until the temporary password is replaced', async () => {
    const user = userEvent.setup();
    changePassword.mockResolvedValue({ data: { message: 'ok' } });
    render(<ForcePasswordChange />);

    const dialog = screen.getByRole('dialog', { name: /Ganti password sementara/i });
    expect(dialog).toBeInTheDocument();
    await user.type(screen.getByLabelText('Password sementara'), 'Temp-Pass-123');
    await user.type(screen.getByLabelText('Password baru'), 'NewSecure-789');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'NewSecure-789');
    await user.click(screen.getByRole('button', { name: /Simpan password/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'Temp-Pass-123', newPassword: 'NewSecure-789', confirmPassword: 'NewSecure-789',
    });
    expect(JSON.parse(window.localStorage.getItem('user') || '{}').mustChangePassword).toBe(false);
  });

  it('validates locally before calling the API', async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChange />);
    await user.type(screen.getByLabelText('Password sementara'), 'Temp-Pass-123');
    await user.type(screen.getByLabelText('Password baru'), 'short');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'short');
    await user.click(screen.getByRole('button', { name: /Simpan password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/minimal 8/);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('shows the API error when the temporary password is wrong', async () => {
    const user = userEvent.setup();
    changePassword.mockRejectedValue({ response: { data: { error: 'Password saat ini salah.' } } });
    render(<ForcePasswordChange />);
    await user.type(screen.getByLabelText('Password sementara'), 'wrong-pass');
    await user.type(screen.getByLabelText('Password baru'), 'NewSecure-789');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'NewSecure-789');
    await user.click(screen.getByRole('button', { name: /Simpan password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Password saat ini salah.');
  });

  it('renders nothing for users without the flag', () => {
    window.localStorage.setItem('user', JSON.stringify({ username: 'x', mustChangePassword: false }));
    render(<ForcePasswordChange />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
