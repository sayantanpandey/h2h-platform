/**
 * Database Enums
 * All enum types used across the database
 */

// User Roles
export const UserRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Appointment Status
export const AppointmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

// Payment Status
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

// Consultation Mode
export const ConsultationMode = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BOTH: 'both',
} as const;

export type ConsultationModeType = typeof ConsultationMode[keyof typeof ConsultationMode];

// Service Categories (8 categories)
export const ServiceCategory = {
  PAIN_RELIEF_PHYSIOTHERAPY: 'pain_relief_physiotherapy',
  ADVANCED_REHABILITATION: 'advanced_rehabilitation',
  NUTRITION_LIFESTYLE: 'nutrition_lifestyle',
  MENTAL_WELLNESS: 'mental_wellness',
  THERAPEUTIC_YOGA: 'therapeutic_yoga',
  SPORTS_PERFORMANCE: 'sports_performance',
  DIGITAL_HEALTH: 'digital_health',
  MASSAGE_RECOVERY: 'massage_recovery',
} as const;

export type ServiceCategoryType = typeof ServiceCategory[keyof typeof ServiceCategory];

// Service Category Labels (for display)
export const ServiceCategoryLabels: Record<ServiceCategoryType, string> = {
  pain_relief_physiotherapy: 'Pain Relief & Physiotherapy Care',
  advanced_rehabilitation: 'Advanced Rehabilitation & Recovery',
  nutrition_lifestyle: 'Nutrition & Lifestyle Care',
  mental_wellness: 'Mental Wellness & Performance Care',
  therapeutic_yoga: 'Therapeutic Yoga & Wellness',
  sports_performance: 'Sports Performance & Athlete Development',
  digital_health: 'Digital Health & Web Solutions',
  massage_recovery: 'Massage & Recovery',
};

// Location Tiers
export const LocationTier = {
  TIER_1: 1,
  TIER_2: 2,
} as const;

export type LocationTierType = typeof LocationTier[keyof typeof LocationTier];

// Days of Week
export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export type DayOfWeekType = typeof DayOfWeek[keyof typeof DayOfWeek];

export const DayOfWeekLabels: Record<DayOfWeekType, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
