export type UserRole = 'super_admin' | 'location_admin' | 'doctor' | 'patient';

export type AppointmentMode = 'online' | 'offline' | 'home_visit';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type ServiceCategory = 'pain_relief_physiotherapy' | 'advanced_rehabilitation' | 'massage_recovery' | 'nutrition_lifestyle' | 'mental_wellness' | 'therapeutic_yoga' | 'sports_performance' | 'digital_health';

export type NotificationType = 'whatsapp' | 'sms' | 'email';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export type LocationTier = 1 | 2;

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  location_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  tier: LocationTier;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string | null;
  duration_minutes: number;
  tier1_price: number;
  tier2_price: number;
  online_available: boolean;
  offline_available: boolean;
  home_visit_available: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  location_id: string;
  specializations: string[];
  qualifications: string[] | null;
  experience_years: number | null;
  bio: string | null;
  google_calendar_id: string | null;
  google_meet_enabled: boolean;
  consultation_fee: number | null;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  user?: User;
  location?: Location;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface DoctorService {
  doctor_id: string;
  service_id: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  location_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  amount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  google_meet_link: string | null;
  google_calendar_event_id: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  patient?: User;
  doctor?: Doctor;
  service?: Service;
  location?: Location;
}

export interface Payment {
  id: string;
  appointment_id: string;
  user_id: string;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_method: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  file_url: string;
  file_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  type: NotificationType;
  template: string;
  status: NotificationStatus;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
}

export type ContactMessageStatus = 'new' | 'read' | 'replied';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  services: string[];
  status: ContactMessageStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at'>;
        Update: Partial<Omit<Location, 'id'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at'>;
        Update: Partial<Omit<Service, 'id'>>;
      };
      doctors: {
        Row: Doctor;
        Insert: Omit<Doctor, 'id' | 'created_at' | 'rating' | 'total_reviews'>;
        Update: Partial<Omit<Doctor, 'id'>>;
      };
      doctor_availability: {
        Row: DoctorAvailability;
        Insert: Omit<DoctorAvailability, 'id'>;
        Update: Partial<Omit<DoctorAvailability, 'id'>>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Appointment, 'id'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'>;
        Update: Partial<Omit<Payment, 'id'>>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: Omit<Prescription, 'id' | 'created_at'>;
        Update: Partial<Omit<Prescription, 'id'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Omit<ContactMessage, 'id' | 'created_at'> & { services?: string[] };
        Update: Partial<Omit<ContactMessage, 'id'>>;
      };
    };
  };
}
