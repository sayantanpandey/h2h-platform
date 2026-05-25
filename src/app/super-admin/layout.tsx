'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminContactNotifications } from '@/components/admin/AdminContactNotifications';
import { AdminBookingNotifications } from '@/components/admin/AdminBookingNotifications';
import { AdminNotificationDrawer } from '@/components/admin/AdminNotificationDrawer';
import { PortalSidebarBrand } from '@/components/shared/PortalSidebarBrand';
import { AdminLayoutSkeleton } from '@/components/admin/AdminSkeletons';
import { AdminProfilePhotoDialog } from '@/components/admin/AdminProfilePhotoDialog';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  UserCircle2,
  Stethoscope,
  MapPin,
  Calendar,
  CreditCard,
  LogOut,
  Menu,
  X,
  CalendarClock,
  BarChart3,
  MessageCircle,
  Bell
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [seenBookingIds, setSeenBookingIds] = useState<Set<string>>(new Set());
  const [unseenBookingCount, setUnseenBookingCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('admin_seen_bookings') : null;
      const arr = raw ? JSON.parse(raw) : [];
      setSeenBookingIds(new Set(Array.isArray(arr) ? arr : []));
    } catch {}
  }, [user?.role]);

  const markBookingAsRead = (id: string) => {
    setSeenBookingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        typeof window !== 'undefined' && sessionStorage.setItem('admin_seen_bookings', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/admin/appointments?limit=50');
        const data = await res.json().catch(() => ({}));
        if (!data.success || !Array.isArray(data.data)) return;
        const list = data.data as { id?: string; payment_status?: string; created_at?: string }[];
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const unseen = list.filter(
          (a) =>
            a.id &&
            a.payment_status === 'paid' &&
            !seenBookingIds.has(a.id) &&
            new Date(a.created_at || 0).getTime() >= cutoff
        );
        setUnseenBookingCount(unseen.length);
      } catch {}
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [user?.role, seenBookingIds]);

  // Skip auth check for login page
  const isLoginPage = pathname === '/super-admin/login';

  useEffect(() => {
    if (!isLoginPage) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [isLoginPage]);

  // Lock body scroll when mobile sidebar is open (must run unconditionally — Rules of Hooks)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    document.body.style.overflow = '';
  }, [sidebarOpen]);

  // Poll new contact message count (super admin only) — must run before any early return (Rules of Hooks)
  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/contact-messages?status=new');
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setNewMessageCount(data.data.length);
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [user?.role]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user || !['super_admin', 'location_admin'].includes(data.user.role)) {
        router.push('/super-admin/login');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/super-admin/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/super-admin/login');
  }

  if (loading) {
    return <AdminLayoutSkeleton />;
  }

  // Render login page without admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/super-admin/analytics', icon: BarChart3, label: 'Analytics', superAdminOnly: true },
    { href: '/super-admin/notifications', icon: Bell, label: 'Notifications', superAdminOnly: true },
    { href: '/super-admin/help-support', icon: MessageCircle, label: 'Help & Support', superAdminOnly: true },
    { href: '/super-admin/services', icon: Stethoscope, label: 'Services' },
    { href: '/super-admin/doctors', icon: UserCircle2, label: 'Doctors' },
    { href: '/super-admin/locations', icon: MapPin, label: 'Locations' },
    { href: '/super-admin/appointments', icon: Calendar, label: 'Appointments' },
    { href: '/super-admin/schedule-requests', icon: CalendarClock, label: 'Schedule requests', superAdminOnly: true },
    { href: '/super-admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/super-admin/users', icon: Users, label: 'Users', superAdminOnly: true },
    { href: '/super-admin/settings', icon: Settings, label: 'Settings' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.superAdminOnly || user?.role === 'super_admin'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {user?.role === 'super_admin' && (
        <>
          <AdminContactNotifications />
          <AdminBookingNotifications />
          <AdminNotificationDrawer
            open={notificationDrawerOpen}
            onOpenChange={setNotificationDrawerOpen}
            seenBookingIds={seenBookingIds}
            onMarkBookingAsRead={markBookingAsRead}
          />
        </>
      )}
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — overlay on mobile (≤85vw), fixed 240px on lg */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(240px,85vw)] lg:w-[240px] bg-[#1a2e35] border-r border-white/5 shadow-xl transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between gap-2 px-4 border-b border-white/10 shrink-0">
          <PortalSidebarBrand
            variant="admin"
            href="/super-admin"
            onNavigate={() => setSidebarOpen(false)}
            className="min-w-0 flex-1"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden shrink-0 p-2 -mr-1 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav — scrollable, consistent spacing */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 min-h-0">
          <div className="space-y-0.5">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setSidebarOpen(false); if (item.href === '/super-admin/help-support') setNewMessageCount(0); }}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.href === '/super-admin/help-support' && newMessageCount > 0 && (
                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-cyan-400 text-[#1a2e35] text-[11px] font-bold flex items-center justify-center">
                      {newMessageCount > 99 ? '99+' : newMessageCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer — user + logout */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
          <div className="rounded-lg bg-white/5 px-3 py-2.5">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[11px] font-medium capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
            {user?.id && (
              <AdminProfilePhotoDialog
                userId={user.id}
                email={user.email}
                fullName={user.full_name}
                avatarUrl={user.avatar_url}
                onSaved={(url) => setUser((prev: typeof user) => (prev ? { ...prev, avatar_url: url } : prev))}
              />
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-[13px] font-medium"
          >
            <LogOut size={17} className="shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — takes remaining width after sidebar */}
      <div className="min-h-screen lg:pl-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm h-14 flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden shrink-0 p-2.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          {user?.role === 'super_admin' && newMessageCount > 0 && (
            <Link
              href="/super-admin/help-support"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-sm font-medium shrink-0"
              onClick={() => setNewMessageCount(0)}
            >
              <MessageCircle size={18} />
              {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
            </Link>
          )}
          {user?.role === 'super_admin' && (
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              className="relative flex items-center justify-center gap-1 p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 overflow-visible"
              aria-label="Notifications"
            >
              <Bell size={20} className="shrink-0" />
              {(newMessageCount + unseenBookingCount) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white z-10">
                  {newMessageCount + unseenBookingCount > 99 ? '99+' : newMessageCount + unseenBookingCount}
                </span>
              )}
            </button>
          )}
          <div className="flex-1 min-w-0" />
          <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[140px] sm:max-w-none" title={user?.full_name || user?.email}>
            {user?.full_name || user?.email}
          </span>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
