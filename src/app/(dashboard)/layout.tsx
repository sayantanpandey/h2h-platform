import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/Header';
import { ROLES, ROLE_DASHBOARDS, canAccessRoute, type UserRole } from '@/lib/auth/roles';
import { headers, cookies } from 'next/headers';
import { LazyAnimatedGrid } from '@/components/dashboard/LazyAnimatedGrid';
import { verifyDoctorSession } from '@/lib/doctor-session';
import { DoctorBookingNotifications } from '@/components/doctor/DoctorBookingNotifications';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check current path to determine if this is a doctor route
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const cookieStore = await cookies();

  // Doctor routes use cookie-based auth (not Supabase Auth)
  const isDoctorRoute = pathname.startsWith('/doctor') || cookieStore.get('doctor_session')?.value;
  
  let userData: {
    id: string;
    email: string;
    fullName: string | null;
    role: UserRole;
    avatarUrl: string | null;
  };

  if (isDoctorRoute) {
    const doctorCookie = cookieStore.get('doctor_session')?.value;
    if (!doctorCookie) {
      redirect('/doctor/login');
    }
    const doctorData = verifyDoctorSession(doctorCookie);
    if (!doctorData) {
      redirect('/doctor/login');
    }
    userData = {
      id: doctorData.id,
      email: doctorData.email,
      fullName: doctorData.fullName,
      role: ROLES.DOCTOR as UserRole,
      avatarUrl: null,
    };
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const userRole = (user.user_metadata?.role as UserRole) || ROLES.PATIENT;

    // Check if user can access the current route
    if (pathname && !canAccessRoute(userRole, pathname)) {
      redirect(ROLE_DASHBOARDS[userRole]);
    }

    userData = {
      id: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name || null,
      role: userRole,
      avatarUrl: user.user_metadata?.avatar_url || null,
    };
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {isDoctorRoute && <DoctorBookingNotifications />}
      {/* Fixed Sidebar - h-screen */}
      <DashboardSidebar user={userData} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header */}
        <DashboardHeader user={userData} />
        
        {/* Scrollable content — decorative grid stays behind (never over cards/forms) */}
        <main className="flex-1 overflow-y-auto relative isolate bg-gray-50">
          <LazyAnimatedGrid
            numSquares={12}
            maxOpacity={0.05}
            duration={4}
            repeatDelay={1.5}
            className="fill-cyan-500/20 stroke-cyan-500/20"
          />
          <div className="relative z-[1] min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
