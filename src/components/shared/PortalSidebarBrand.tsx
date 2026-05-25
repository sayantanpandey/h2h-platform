'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND_IMAGES } from '@/constants/marketing-images';
import type { UserRole } from '@/lib/auth/roles';
import { ROLES } from '@/lib/auth/roles';

export type PortalBrandVariant = 'admin' | 'doctor' | 'patient' | 'location-admin';

const PORTAL_LABELS: Record<PortalBrandVariant, string> = {
  admin: 'Admin Portal',
  doctor: 'Doctor Portal',
  patient: 'Patient Portal',
  'location-admin': 'Clinic Portal',
};

const PORTAL_HREFS: Record<PortalBrandVariant, string> = {
  admin: '/super-admin',
  doctor: '/doctor',
  patient: '/patient',
  'location-admin': '/location-admin',
};

export function portalVariantFromRole(role?: UserRole): PortalBrandVariant {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return 'admin';
    case ROLES.LOCATION_ADMIN:
      return 'location-admin';
    case ROLES.DOCTOR:
      return 'doctor';
    default:
      return 'patient';
  }
}

export function portalVariantFromPath(pathname: string): PortalBrandVariant {
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/location-admin')) return 'location-admin';
  if (pathname.startsWith('/doctor')) return 'doctor';
  return 'patient';
}

interface PortalSidebarBrandProps {
  href?: string;
  variant?: PortalBrandVariant;
  portalLabel?: string;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
}

export function PortalSidebarBrand({
  href,
  variant = 'patient',
  portalLabel,
  collapsed = false,
  className,
  onNavigate,
}: PortalSidebarBrandProps) {
  const label = portalLabel ?? PORTAL_LABELS[variant];
  const homeHref = href ?? PORTAL_HREFS[variant];

  return (
    <Link
      href={homeHref}
      onClick={onNavigate}
      className={cn(
        'group flex items-center min-w-0 transition-opacity hover:opacity-95',
        collapsed ? 'justify-center' : 'gap-3',
        className
      )}
      aria-label={`H2H Healthcare — ${label}`}
    >
      {/* Native img — logo-short.webp is RGBA; no white box (was invisible on light bg) */}
      <img
        src={BRAND_IMAGES.logoShort}
        alt="H2H Healthcare"
        width={44}
        height={44}
        className={cn(
          'shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]',
          'transition-transform duration-200 group-hover:scale-[1.03]',
          collapsed ? 'h-10 w-10' : 'h-11 w-11'
        )}
      />
      {!collapsed && (
        <div className="min-w-0 flex flex-col leading-none">
          <span className="font-bold text-[15px] text-white tracking-tight truncate">
            H2H Healthcare
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-400/90 truncate">
            {label}
          </span>
        </div>
      )}
    </Link>
  );
}
