import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{
        marginLeft: 230,
        flex: 1,
        padding: '32px 32px',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        {children}
      </main>
    </div>
  );
}
