import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

// jsdom lacks object URLs (used for local image previews).
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
