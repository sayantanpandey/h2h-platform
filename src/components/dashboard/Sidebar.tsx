'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  Stethoscope,
  MapPin,
  CreditCard,
  BarChart3,
  MessageSquare,
  User,
  Building2,
  ChevronLeft,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ROLES, ROLE_DASHBOARDS, ROLE_LABELS, type UserRole } from '@/lib/auth/roles';
import {
  PortalSidebarBrand,
  portalVariantFromPath,
  portalVariantFromRole,
  type PortalBrandVariant,
} from '@/components/shared/PortalSidebarBrand';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  avatarUrl: string | null;
}

interface DashboardSidebarProps {
  user?: UserData;
}

const patientNav: NavItem[] = [
  { title: 'Dashboard', href: '/patient', icon: LayoutDashboard },
  { title: 'My Appointments', href: '/patient/appointments', icon: Calendar },
  { title: 'Find Doctors', href: '/patient/doctors', icon: Stethoscope },
  { title: 'Medical Records', href: '/patient/records', icon: FileText },
  { title: 'Payments', href: '/patient/payments', icon: CreditCard },
  { title: 'Profile', href: '/patient/profile', icon: User },
];

const doctorNav: NavItem[] = [
  { title: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
  { title: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { title: 'Patients', href: '/doctor/patients', icon: Users },
  { title: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { title: 'Activity', href: '/doctor/activity', icon: Activity },
  { title: 'Schedule', href: '/doctor/schedule', icon: Calendar },
  { title: 'Profile', href: '/doctor/profile', icon: User },
];

const locationAdminNav: NavItem[] = [
  { title: 'Dashboard', href: '/location-admin', icon: LayoutDashboard },
  { title: 'Appointments', href: '/location-admin/appointments', icon: Calendar },
  { title: 'Doctors', href: '/location-admin/doctors', icon: Stethoscope },
  { title: 'Patients', href: '/location-admin/patients', icon: Users },
  { title: 'Reports', href: '/location-admin/reports', icon: BarChart3 },
  { title: 'Settings', href: '/location-admin/settings', icon: Settings },
];

const superAdminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { title: 'Prescriptions', href: '/admin/prescriptions', icon: FileText },
  { title: 'Locations', href: '/admin/locations', icon: MapPin },
  { title: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Services', href: '/admin/services', icon: Building2 },
  { title: 'Payments', href: '/admin/payments', icon: CreditCard },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { title: 'Support', href: '/admin/support', icon: MessageSquare },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

function SidebarContent({ 
  navItems, 
  pathname, 
  onLogout,
  collapsed = false,
  user,
  brandVariant,
  brandHref,
}: { 
  navItems: NavItem[]; 
  pathname: string;
  onLogout: () => void;
  collapsed?: boolean;
  user?: UserData;
  brandVariant: PortalBrandVariant;
  brandHref: string;
}) {
  return (
    <div className="flex flex-col h-full bg-[#1a2e35]">
      {/* Logo */}
      <div className={cn("h-16 flex items-center shrink-0 border-b border-white/5", collapsed ? "px-3 justify-center" : "px-4")}>
        <PortalSidebarBrand
          href={brandHref}
          variant={brandVariant}
          collapsed={collapsed}
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => {
            // For dashboard links, only match exact path
            const isDashboard = item.title === 'Dashboard';
            const isActive = isDashboard 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-white"
                )} />
                {!collapsed && item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className={cn("border-t border-white/10", collapsed ? "p-2" : "p-4")}>
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <img
              src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.fullName || user.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt={user.fullName || 'User'}
              className="h-9 w-9 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{user.fullName || 'User'}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        )}
        {user && collapsed && (
          <div className="flex justify-center mb-2">
            <img
              src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.fullName || user.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt={user.fullName || 'User'}
              className="h-8 w-8 rounded-full"
            />
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-400 hover:text-white hover:bg-white/10 text-[13px] transition-colors",
            collapsed && "justify-center px-2"
          )}
          onClick={onLogout}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span className="ml-2.5">Logout</span>}
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = (): NavItem[] => {
    // Use user role if available, otherwise fall back to pathname-based detection
    if (user) {
      switch (user.role) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
          return superAdminNav;
        case ROLES.LOCATION_ADMIN:
          return locationAdminNav;
        case ROLES.DOCTOR:
          return doctorNav;
        default:
          return patientNav;
      }
    }
    // Fallback to pathname-based detection
    if (pathname.startsWith('/admin')) return superAdminNav;
    if (pathname.startsWith('/location-admin')) return locationAdminNav;
    if (pathname.startsWith('/doctor')) return doctorNav;
    return patientNav;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = getNavItems();
  const brandVariant = user ? portalVariantFromRole(user.role) : portalVariantFromPath(pathname);
  const brandHref = pathname.startsWith('/super-admin')
    ? '/super-admin'
    : pathname.startsWith('/admin')
      ? '/admin'
      : pathname.startsWith('/location-admin')
        ? '/location-admin'
        : pathname.startsWith('/doctor')
          ? '/doctor'
          : pathname.startsWith('/patient')
            ? '/patient'
            : user
              ? ROLE_DASHBOARDS[user.role]
              : '/patient';

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40 h-10 w-10 bg-white shadow-md border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <SidebarContent 
            navItems={navItems} 
            pathname={pathname} 
            onLogout={handleLogout}
            user={user}
            brandVariant={brandVariant}
            brandHref={brandHref}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Fixed h-screen */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 bg-[#1a2e35] transition-all duration-300 relative shadow-xl overflow-visible',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <SidebarContent 
            navItems={navItems} 
            pathname={pathname} 
            onLogout={handleLogout}
            collapsed={collapsed}
            user={user}
            brandVariant={brandVariant}
            brandHref={brandHref}
          />
        </div>
        {/* Collapse Toggle Button - fully visible, high z-index */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-20 h-8 w-8 rounded-full border-gray-200 bg-white shadow-lg hover:bg-gray-50 hover:shadow-xl z-[100] transition-all"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 text-gray-600 transition-transform duration-200", collapsed && "rotate-180")} />
        </Button>
      </aside>
    </>
  );
}
