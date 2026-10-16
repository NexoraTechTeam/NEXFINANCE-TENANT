import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import ConsoleGate from '@/components/console/ConsoleGate';
import { isConsoleHost } from '@/lib/tenant-server';

export const metadata = { title: 'NexFinance Console', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** The operator console only exists on CONSOLE_HOSTS; school domains get a 404. */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  if (!isConsoleHost()) notFound();
  return <ConsoleGate>{children}</ConsoleGate>;
}
