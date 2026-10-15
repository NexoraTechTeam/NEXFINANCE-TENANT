export type TourArea = 'sidebar' | 'main';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector of the element to highlight. Omit for a centered step. */
  target?: string;
  /** Where the target lives; sidebar steps open the drawer on small screens. */
  area?: TourArea;
}

export const TOUR_STORAGE_KEY = 'nexfinance.tour.v1';

export const APP_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Selamat datang di NexFinance',
    body: 'Tur singkat ini (±1 menit) memperkenalkan area utama aplikasi. Gunakan tombol Lanjut atau tombol panah keyboard, dan tekan Esc kapan saja untuk berhenti.',
  },
  {
    id: 'brand',
    title: 'Workspace aktif',
    body: 'Kartu ini selalu menunjukkan modul yang sedang Anda buka, sehingga Anda tidak kehilangan konteks saat berpindah halaman.',
    target: '[data-tour="brand"]',
    area: 'sidebar',
  },
  {
    id: 'nav',
    title: 'Navigasi modul',
    body: 'Semua modul keuangan ada di sini: Dashboard, SPP, Penggajian, Pengeluaran, Pengadaan, Akuntansi, Laporan, Log Historis, dan Master Data.',
    target: '[data-tour="nav"]',
    area: 'sidebar',
  },
  {
    id: 'content',
    title: 'Area kerja',
    body: 'Konten modul tampil di sini: ringkasan KPI di atas, lalu tabel, filter, dan tombol aksi seperti membuat invoice atau mengajukan pengeluaran.',
    target: '[data-tour="content"]',
    area: 'main',
  },
  {
    id: 'help-menu',
    title: 'Menu Bantuan',
    body: 'Buka Pusat Bantuan untuk panduan per modul, FAQ, dan pintasan keyboard. Tur ini juga bisa diulang dari sana kapan saja.',
    target: '[data-tour="help-menu"]',
    area: 'sidebar',
  },
  {
    id: 'profile',
    title: 'Akun & keamanan',
    body: 'Lihat akun yang sedang login, ubah password, dan keluar dengan aman dari bagian ini.',
    target: '[data-tour="profile"]',
    area: 'sidebar',
  },
  {
    id: 'help-launcher',
    title: 'Bantuan cepat di setiap halaman',
    body: 'Tombol ini menampilkan tips singkat sesuai halaman yang sedang dibuka, tanpa meninggalkan pekerjaan Anda.',
    target: '[data-tour="help-launcher"]',
    area: 'main',
  },
  {
    id: 'done',
    title: 'Siap mulai!',
    body: 'Anda sudah mengenal dasar NexFinance. Jika butuh panduan lagi, buka menu Bantuan di sidebar atau tombol bantuan di pojok kanan bawah.',
  },
];

export interface TourState {
  active: boolean;
  index: number;
  total: number;
  completed: boolean;
}

export type TourAction =
  | { type: 'start'; total: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; index: number }
  | { type: 'skip' };

export const initialTourState: TourState = { active: false, index: 0, total: 0, completed: false };

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'start':
      return action.total > 0
        ? { active: true, index: 0, total: action.total, completed: false }
        : state;
    case 'next':
      if (!state.active) return state;
      return state.index + 1 >= state.total
        ? { ...state, active: false, completed: true }
        : { ...state, index: state.index + 1 };
    case 'prev':
      if (!state.active) return state;
      return { ...state, index: Math.max(0, state.index - 1) };
    case 'goto':
      if (!state.active || action.index < 0 || action.index >= state.total) return state;
      return { ...state, index: action.index };
    case 'skip':
      return state.active ? { ...state, active: false, completed: true } : state;
    default:
      return state;
  }
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Treats unavailable storage as "completed" so the tour never nags in locked-down browsers. */
export function hasCompletedTour(storage: StorageLike | undefined): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(TOUR_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

export function markTourCompleted(storage: StorageLike | undefined) {
  try {
    storage?.setItem(TOUR_STORAGE_KEY, new Date().toISOString());
  } catch {
    // Storage blocked (private mode / policy) — completion simply isn't remembered.
  }
}

export function resetTourCompletion(storage: StorageLike | undefined) {
  try {
    storage?.removeItem(TOUR_STORAGE_KEY);
  } catch {
    // ignore
  }
}
