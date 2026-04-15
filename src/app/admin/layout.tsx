'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { LayoutDashboard, FileText, Briefcase, Users, MessageSquare, BarChart3, LogOut, Menu, Wrench, Star, UserCog, Layout, X, ChevronLeft, Handshake } from 'lucide-react';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/hero', label: 'Hero Section', icon: Layout },
  { href: '/admin/services', label: 'Services', icon: Wrench },
  { href: '/admin/projects', label: 'Projects', icon: Briefcase },
  { href: '/admin/posts', label: 'Blog Posts', icon: FileText },
  { href: '/admin/team', label: 'Team Members', icon: Users },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/stats', label: 'Stats', icon: BarChart3 },
  { href: '/admin/users', label: 'Users & Roles', icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout, hydrate } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof window !== 'undefined' && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Handle touch swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.touches[0].clientX;
    if (diff > 50 && sidebarRef.current) {
      setSidebarOpen(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  useEffect(() => {
    if (hydrated && !isAuthenticated && !pathname.includes('/login')) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header with Logo + Close Button */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/logo.svg"
            alt="SwiftPro"
            style={{ height: '54px', width: 'auto' }}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1.5rem',
                  color: active ? 'white' : 'rgba(255,255,255,0.65)',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.9rem',
                  borderLeft: `4px solid ${active ? '#3A86FF' : 'transparent'}`,
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3A86FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                {initials(user.username || user.email)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'capitalize' }}>{user.role || 'admin'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 0.875rem',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile swipe indicator */}
        <div className="sidebar-swipe-indicator" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', opacity: 0.3 }}>
          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        <header className="admin-header">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-toggle"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <Menu size={22} />
          </button>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
            {menuItems.find(m => m.href === pathname)?.label || 'Dashboard'}
          </p>
          {user && (
            <p className="header-user" style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
              Signed in as <strong style={{ color: '#111' }}>{user.username}</strong>
              {user.role && <span style={{ marginLeft: '0.5rem', background: user.role === 'admin' ? '#EFF6FF' : '#F3F4F6', color: user.role === 'admin' ? '#3B82F6' : '#6B7280', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{user.role}</span>}
            </p>
          )}
        </header>
        <div>
          {children}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}