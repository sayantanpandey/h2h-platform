import { Skeleton } from '@/components/ui/skeleton';

type ContentVariant = 'cards' | 'table' | 'dashboard';

/** Full admin shell while auth is verified — sidebar + header only; pages own their content skeletons. */
export function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col bg-[#1a2e35] border-r border-white/5">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
          <Skeleton className="h-11 w-11 rounded-xl bg-white/15 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28 bg-white/15" />
            <Skeleton className="h-2.5 w-20 bg-white/10" />
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-9 rounded-md bg-white/10 ${i === 5 ? 'bg-white/20 w-full' : 'w-[85%]'}`}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <Skeleton className="h-16 rounded-lg bg-white/10 w-full" />
          <Skeleton className="h-9 rounded-md bg-white/10 w-full" />
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:pl-[240px]">
        <header className="sticky top-0 z-30 bg-white/95 border-b border-gray-100 h-14 flex items-center justify-end px-6 gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </header>
        <main className="p-6 lg:p-8">
          <Skeleton className="h-[min(420px,60vh)] w-full rounded-xl bg-gray-100" />
        </main>
      </div>
    </div>
  );
}

export function AdminContentSkeleton({ variant = 'cards' }: { variant?: ContentVariant }) {
  if (variant === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-52 mb-2" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
      <DoctorCardsSkeleton count={6} />
    </div>
  );
}

/** Generic list rows (notifications, messages, etc.) */
export function ListItemsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

/** Stacked cards (schedule requests, reschedule list) */
export function StackedCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

/** Patient / admin appointments list */
export function AppointmentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Records / payments table body */
export function TableBodySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16 shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-xs" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-6 w-16 ml-auto rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Doctor profile / form pages */
export function ProfileFormSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

/** Prescriptions list */
export function PrescriptionsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <StackedCardsSkeleton count={4} />
    </div>
  );
}

/** Admin appointments page — stats + table */
export function AppointmentsAdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

/** Analytics charts */
export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

/** Super-admin login auth check */
export function AuthCheckSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function DoctorCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-14 w-14 rounded-full shrink-0 bg-gray-100" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-3/4 bg-gray-100" />
              <Skeleton className="h-3 w-full bg-gray-100" />
              <Skeleton className="h-3 w-24 bg-gray-100" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
