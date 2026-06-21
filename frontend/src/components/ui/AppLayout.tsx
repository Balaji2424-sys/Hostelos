'use client';
import Sidebar from '@/components/ui/Sidebar';
import { AuthProvider } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, padding: '28px 32px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
          <div className="animate-up">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
