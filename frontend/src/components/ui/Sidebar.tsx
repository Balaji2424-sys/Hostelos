'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BedDouble, Users, CreditCard,
  Zap, MessageSquare, BarChart3, Bell, Settings,
  LogOut, Building2, Bot
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rooms', icon: BedDouble, label: 'Rooms' },
  { href: '/tenants', icon: Users, label: 'Tenants' },
  { href: '/payments', icon: CreditCard, label: 'Payments' },
  { href: '/electricity', icon: Zap, label: 'Electricity' },
  { href: '/complaints', icon: MessageSquare, label: 'Complaints' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/ai', icon: Bot, label: 'AI Assistant' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar" style={{
      width: 220, minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: '16px 12px', position: 'fixed', top: 0, left: 0, zIndex: 50
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px 20px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Building2 size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>HostelOS</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item ${active ? 'active' : ''}`}>
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
          <ThemeToggle />
        </div>
        <button className="sidebar-item" onClick={logout} style={{ width: '100%', border: 'none', background: 'none' }}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
