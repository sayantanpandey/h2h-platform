/**
 * H2H Healthcare - Role-Based Access Control (RBAC)
 * Production-grade role management system
 */

// Define all available roles in the system
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  LOCATION_ADMIN: 'location_admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy - higher index = more permissions
export const ROLE_HIERARCHY: UserRole[] = [
  ROLES.PATIENT,
  ROLES.DOCTOR,
  ROLES.LOCATION_ADMIN,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.LOCATION_ADMIN]: 'Location Admin',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.PATIENT]: 'Patient',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Full system access. Can manage all users, roles, and platform settings.',
  [ROLES.ADMIN]: 'Platform administration. Can manage locations, doctors, and view reports.',
  [ROLES.LOCATION_ADMIN]: 'Location management. Can manage doctors and appointments at assigned locations.',
  [ROLES.DOCTOR]: 'Medical professional. Can view appointments, patients, and manage schedules.',
  [ROLES.PATIENT]: 'Standard user. Can book appointments and view medical records.',
};

// Default dashboard routes for each role
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: '/super-admin',
  [ROLES.ADMIN]: '/admin',
  [ROLES.LOCATION_ADMIN]: '/location-admin',
  [ROLES.DOCTOR]: '/doctor',
  [ROLES.PATIENT]: '/patient',
};

// Permissions for each role
export const PERMISSIONS = {
  // User management
  MANAGE_ALL_USERS: 'manage_all_users',
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_LOCATION_ADMINS: 'manage_location_admins',
  MANAGE_DOCTORS: 'manage_doctors',
  MANAGE_PATIENTS: 'manage_patients',
  
  // Role management
  ASSIGN_ROLES: 'assign_roles',
  MODIFY_PERMISSIONS: 'modify_permissions',
  
  // Location management
  MANAGE_ALL_LOCATIONS: 'manage_all_locations',
  MANAGE_ASSIGNED_LOCATION: 'manage_assigned_location',
  
  // Appointment management
  VIEW_ALL_APPOINTMENTS: 'view_all_appointments',
  VIEW_LOCATION_APPOINTMENTS: 'view_location_appointments',
  VIEW_OWN_APPOINTMENTS: 'view_own_appointments',
  MANAGE_APPOINTMENTS: 'manage_appointments',
  
  // Financial
  VIEW_ALL_REVENUE: 'view_all_revenue',
  VIEW_LOCATION_REVENUE: 'view_location_revenue',
  MANAGE_PAYMENTS: 'manage_payments',
  
  // Reports
  VIEW_PLATFORM_REPORTS: 'view_platform_reports',
  VIEW_LOCATION_REPORTS: 'view_location_reports',
  
  // Settings
  MANAGE_PLATFORM_SETTINGS: 'manage_platform_settings',
  MANAGE_LOCATION_SETTINGS: 'manage_location_settings',
  
  // Services
  MANAGE_SERVICES: 'manage_services',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Super admin has all permissions
  
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_LOCATION_ADMINS,
    PERMISSIONS.MANAGE_DOCTORS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_ALL_LOCATIONS,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_REVENUE,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_PLATFORM_REPORTS,
    PERMISSIONS.MANAGE_SERVICES,
  ],
  
  [ROLES.LOCATION_ADMIN]: [
    PERMISSIONS.MANAGE_DOCTORS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_ASSIGNED_LOCATION,
    PERMISSIONS.VIEW_LOCATION_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_LOCATION_REVENUE,
    PERMISSIONS.VIEW_LOCATION_REPORTS,
    PERMISSIONS.MANAGE_LOCATION_SETTINGS,
  ],
  
  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
  ],
  
  [ROLES.PATIENT]: [
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
  ],
};

// Helper functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  // Super admin can manage everyone
  if (managerRole === ROLES.SUPER_ADMIN) return true;
  
  // Admin can manage location_admin, doctor, patient
  if (managerRole === ROLES.ADMIN) {
    return ([ROLES.LOCATION_ADMIN, ROLES.DOCTOR, ROLES.PATIENT] as UserRole[]).includes(targetRole);
  }
  
  // Location admin can manage doctor, patient
  if (managerRole === ROLES.LOCATION_ADMIN) {
    return ([ROLES.DOCTOR, ROLES.PATIENT] as UserRole[]).includes(targetRole);
  }
  
  return false;
}

// Get roles that a user can assign to others
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
      return [ROLES.ADMIN, ROLES.LOCATION_ADMIN, ROLES.DOCTOR, ROLES.PATIENT];
    case ROLES.ADMIN:
      return [ROLES.LOCATION_ADMIN, ROLES.DOCTOR, ROLES.PATIENT];
    case ROLES.LOCATION_ADMIN:
      return [ROLES.DOCTOR, ROLES.PATIENT];
    default:
      return [];
  }
}

// Route access configuration
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/super-admin': [ROLES.SUPER_ADMIN],
  '/admin': [ROLES.ADMIN],
  '/location-admin': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.LOCATION_ADMIN],
  '/doctor': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.LOCATION_ADMIN, ROLES.DOCTOR],
  '/patient': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.LOCATION_ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
};

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Find matching route pattern
  for (const [pattern, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (route.startsWith(pattern)) {
      return allowedRoles.includes(userRole);
    }
  }
  // Default: allow access if no specific rule
  return true;
}
