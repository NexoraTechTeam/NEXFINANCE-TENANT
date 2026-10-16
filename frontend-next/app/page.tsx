import { redirect } from 'next/navigation';
import { isConsoleHost } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

export default function Home() {
  redirect(isConsoleHost() ? '/console' : '/login');
}
