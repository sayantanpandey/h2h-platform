/**
 * H2H Healthcare - Booking Hooks
 * Complete hooks for the patient booking flow with Razorpay integration
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  tier: 1 | 2;
  phone: string;
  email: string;
  timings: string;
  is_active: boolean;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  duration_minutes: number;
  tier1_price: number;
  tier2_price: number;
  price: number; // Calculated based on location tier
  online_available: boolean;
  offline_available: boolean;
  home_visit_available: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  specializations: string[];
  qualifications: string[];
  experience_years: number;
  bio: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  location: {
    id: string;
    name: string;
    city: string;
  };
  availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingData {
  locationId: string | null;
  serviceId: string | null;
  doctorId: string | null;
  appointmentDate: string | null;
  startTime: string | null;
  mode: 'online' | 'offline' | 'home_visit';
  notes: string;
}

export interface AppointmentResponse {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  location_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  mode: string;
  status: string;
  payment_status: string;
  amount: number;
  razorpay_order_id: string | null;
}

// Hook: Fetch locations from database
export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async (filters?: { city?: string; tier?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.append('city', filters.city);
      if (filters?.tier) params.append('tier', filters.tier.toString());
      
      const response = await fetch(`/api/locations?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch locations');
      }
      
      setLocations(data.data || []);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { locations, loading, error, fetchLocations };
}

// Hook: Fetch services from database
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async (filters?: { 
    category?: string; 
    mode?: string; 
    locationId?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.mode) params.append('mode', filters.mode);
      if (filters?.locationId) params.append('locationId', filters.locationId);
      
      const response = await fetch(`/api/services?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch services');
      }
      
      setServices(data.data || []);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch services';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { services, loading, error, fetchServices };
}

// Hook: Fetch doctors from database
export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async (filters?: { 
    locationId?: string; 
    serviceId?: string;
    date?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.locationId) params.append('locationId', filters.locationId);
      if (filters?.serviceId) params.append('serviceId', filters.serviceId);
      if (filters?.date) params.append('date', filters.date);
      
      const response = await fetch(`/api/doctors?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctors');
      }
      
      setDoctors(data.data || []);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch doctors';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { doctors, loading, error, fetchDoctors };
}

// Hook: Fetch available time slots
export function useTimeSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (doctorId: string, date: string, serviceId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('date', date);
      if (serviceId) params.append('serviceId', serviceId);
      
      const response = await fetch(`/api/doctors/${doctorId}/slots?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch time slots');
      }
      
      setSlots(data.data || []);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch time slots';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, error, fetchSlots };
}

// Hook: Complete booking flow with payment
export function useBookingFlow() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData>({
    locationId: null,
    serviceId: null,
    doctorId: null,
    appointmentDate: null,
    startTime: null,
    mode: 'offline',
    notes: '',
  });
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update booking data
  const updateBooking = useCallback((updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset booking
  const resetBooking = useCallback(() => {
    setBookingData({
      locationId: null,
      serviceId: null,
      doctorId: null,
      appointmentDate: null,
      startTime: null,
      mode: 'offline',
      notes: '',
    });
    setAppointment(null);
    setError(null);
  }, []);

  // Create appointment
  const createAppointment = useCallback(async () => {
    if (!bookingData.doctorId || !bookingData.serviceId || !bookingData.locationId || 
        !bookingData.appointmentDate || !bookingData.startTime) {
      setError('Please complete all booking details');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: bookingData.doctorId,
          serviceId: bookingData.serviceId,
          locationId: bookingData.locationId,
          appointmentDate: bookingData.appointmentDate,
          startTime: bookingData.startTime,
          mode: bookingData.mode,
          notes: bookingData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      setAppointment(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bookingData]);

  const releaseBookingSlot = useCallback(async (id: string, reason: string) => {
    try {
      await fetch('/api/payments/release-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, reason }),
      });
    } catch {
      /* best-effort */
    }
  }, []);

  // Initialize Razorpay payment
  const initiatePayment = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        await releaseBookingSlot(appointmentId, 'order_create_failed');
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        await loadRazorpayScript();
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'H2H Healthcare',
        description: orderData.notes?.service || 'Appointment Booking',
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Payment successful - redirect to confirmation
              router.push(`/booking/confirmation?appointmentId=${appointmentId}`);
            } else {
              setError('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: orderData.prefill?.name || '',
          email: orderData.prefill?.email || '',
          contact: orderData.prefill?.contact || '',
        },
        theme: {
          color: '#06b6d4',
        },
        modal: {
          ondismiss: () => {
            void releaseBookingSlot(appointmentId, 'checkout_dismissed');
            setError('Payment cancelled. This time slot is free again.');
            setLoading(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router, releaseBookingSlot]);

  return {
    bookingData,
    appointment,
    loading,
    error,
    updateBooking,
    resetBooking,
    createAppointment,
    initiatePayment,
  };
}

// Helper: Load Razorpay script
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

// Export combined hook for convenience
export function useCompleteBooking() {
  const locations = useLocations();
  const services = useServices();
  const doctors = useDoctors();
  const timeSlots = useTimeSlots();
  const bookingFlow = useBookingFlow();

  return {
    ...locations,
    ...services,
    ...doctors,
    ...timeSlots,
    ...bookingFlow,
    // Rename to avoid conflicts
    locationsData: locations.locations,
    servicesData: services.services,
    doctorsData: doctors.doctors,
    slotsData: timeSlots.slots,
    locationsLoading: locations.loading,
    servicesLoading: services.loading,
    doctorsLoading: doctors.loading,
    slotsLoading: timeSlots.loading,
  };
}
