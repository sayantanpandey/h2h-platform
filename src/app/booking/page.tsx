'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';

const Confetti = dynamic(() => import('@/components/ui/confetti').then(m => ({ default: m.Confetti })), { ssr: false });
type ConfettiRef = import('@/components/ui/confetti').ConfettiRef;

import { 
  MapPin, Clock, Video, Building2, Home, ArrowRight, ArrowLeft,
  CheckCircle2, IndianRupee, Sparkles, Loader2, Star, AlertCircle, CalendarDays,
  Globe, Users, Phone, Stethoscope
} from 'lucide-react';
import {
  BookingLocationSkeleton,
  BookingCityGridSkeleton,
  BookingServiceSkeleton,
  BookingDoctorSkeleton,
  BookingTimeSlotGridSkeleton,
  BookingPageSuspenseSkeleton,
} from '@/components/booking/BookingSkeletons';
import { format, addDays, isBefore, isSameDay, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';

type BookingStep = 'location' | 'service' | 'doctor' | 'datetime' | 'confirm';

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  tier: number;
  centerId?: string;
  centerName?: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  duration_minutes: number;
  tier1_price: number;
  tier2_price: number;
  price?: number;
  online_available: boolean;
  offline_available: boolean;
  home_visit_available: boolean;
}

interface Doctor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  google_meet_enabled?: boolean;
  offers_online?: boolean;
  offers_clinic?: boolean;
  offers_home_visit?: boolean;
  home_visit_radius_km?: number;
  specializations: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
}

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  duration?: number;
  price?: number;
}

interface SlotTypeOption {
  id: string;
  duration_minutes: number;
  price: number; // Current mode price
  online_price?: number;
  offline_price?: number;
  home_visit_price?: number;
  home_visit_additional_charge?: number;
  label: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  pain_relief_physiotherapy: 'Pain Relief & Physiotherapy',
  advanced_rehabilitation: 'Advanced Rehabilitation',
  massage_recovery: 'Massage & Recovery',
  nutrition_lifestyle: 'Nutrition & Lifestyle',
  mental_wellness: 'Mental Wellness',
  therapeutic_yoga: 'Therapeutic Yoga',
  sports_performance: 'Sports Performance',
  digital_health: 'Digital Health',
};

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);
  
  // Step state
  const [currentStep, setCurrentStep] = useState<BookingStep>('location');
  
  // Data from APIs
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotTypes, setSlotTypes] = useState<SlotTypeOption[]>([]);
  
  // Clinic centers data
  const [clinicCenters, setClinicCenters] = useState<any[]>([]);
  const [groupedCenters, setGroupedCenters] = useState<Record<string, any[]>>({});
  const [cities, setCities] = useState<{name: string; centerCount: number; tier: number}[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<any | null>(null);
  const [locationStep, setLocationStep] = useState<'mode' | 'city' | 'center'>('mode');
  
  // Loading states
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Selection state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'online' | 'offline' | 'home_visit'>('offline');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [selectedSlotType, setSelectedSlotType] = useState<SlotTypeOption | null>(null);
  const [notes, setNotes] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [preSelectedServiceSlug, setPreSelectedServiceSlug] = useState<string | null>(null);
  const [preSelectedDoctorId, setPreSelectedDoctorId] = useState<string | null>(null);
  const [isDoctorFlow, setIsDoctorFlow] = useState(() => !!searchParams.get('doctor')); // Init from URL to avoid flash/loop in doctor-specific flow
  const [isServiceFlow, setIsServiceFlow] = useState(false); // When coming from service page
  const [isLocationFlow, setIsLocationFlow] = useState(false); // When coming from location page
  const [preSelectedServiceName, setPreSelectedServiceName] = useState<string | null>(null); // Name of pre-selected service
  const [preSelectedCategory, setPreSelectedCategory] = useState<string | null>(null); // Category slug from URL
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null); // Filter services by category
  const [doctorServices, setDoctorServices] = useState<Service[]>([]); // Services offered by pre-selected doctor
  const [doctorClinicCenters, setDoctorClinicCenters] = useState<any[]>([]); // Clinic centers where doctor is available
  const [doctorCities, setDoctorCities] = useState<string[]>([]); // Cities where doctor has clinics
  const [doctorAvailability, setDoctorAvailability] = useState<any[]>([]); // Doctor's weekly availability
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  /** Prevents parallel POST /api/bookings (double-tap → 409 slot conflict) */
  const bookingSubmitLockRef = useRef(false);
  /** Scroll target after auto-advancing a step */
  const bookingFlowRef = useRef<HTMLElement>(null);

  // Get URL params (use for initial state to avoid doctor-step flash in doctor-specific flow)
  const doctorParam = searchParams.get('doctor');
  const centerParam = searchParams.get('center');
  const serviceParam = searchParams.get('service');
  const locationParam = searchParams.get('location');
  
  // Fetch locations and clinic centers on mount
  useEffect(() => {
    const fetchData = async () => {
      // FIRST: Check if we're in doctor flow - handle this before anything else
      if (doctorParam) {
        setPreSelectedDoctorId(doctorParam);
        setIsDoctorFlow(true);
        
        try {
          const doctorRes = await fetch(`/api/patient/doctors/${doctorParam}`);
          const doctorData = await doctorRes.json();
          
          if (doctorData.success && doctorData.data) {
            const doc = doctorData.data;
            
            // Set selected doctor
            setSelectedDoctor({
              id: doc.id,
              name: doc.name,
              avatar: doc.avatar,
              google_meet_enabled: doc.googleMeetEnabled,
              offers_online: doc.offersOnline,
              offers_clinic: doc.offersClinic,
              offers_home_visit: doc.offersHomeVisit,
              home_visit_radius_km: doc.homeVisitRadius,
              specializations: doc.specializations || [],
              experience_years: doc.experienceYears || 0,
              rating: doc.rating || 0,
              total_reviews: doc.totalReviews || 0,
              consultation_fee: doc.consultationFee || 0,
            });
            
            // Set doctor's services
            if (doc.services && doc.services.length > 0) {
              setDoctorServices(doc.services.map((s: any) => ({
                id: s.id,
                name: s.name,
                slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
                category: s.category || 'physiotherapy',
                description: s.description || '',
                duration_minutes: s.duration || 30,
                tier1_price: s.price || 0,
                tier2_price: s.price || 0,
                price: s.price || 0,
                online_available: doc.offersOnline,
                offline_available: doc.offersClinic,
                home_visit_available: doc.offersHomeVisit,
              })));
            }
            
            // Set slot types for pricing
            if (doc.consultationTypes && doc.consultationTypes.length > 0) {
              setSlotTypes(doc.consultationTypes.map((st: any) => ({
                id: st.id,
                duration_minutes: st.duration,
                price: st.onlinePrice || st.clinicPrice || 0,
                online_price: st.onlinePrice,
                offline_price: st.clinicPrice,
                label: st.name,
              })));
              
              const firstSlot = doc.consultationTypes[0];
              setSelectedSlotType({
                id: firstSlot.id,
                duration_minutes: firstSlot.duration,
                price: firstSlot.onlinePrice || firstSlot.clinicPrice || 0,
                online_price: firstSlot.onlinePrice,
                offline_price: firstSlot.clinicPrice,
                label: firstSlot.name,
              });
              setSelectedDuration(firstSlot.duration);
            }
            
            // Store doctor's clinic centers and extract unique cities
            if (doc.clinicCenters && doc.clinicCenters.length > 0) {
              setDoctorClinicCenters(doc.clinicCenters);
              // Extract unique cities
              const uniqueCities = [...new Set(doc.clinicCenters.map((c: any) => c.city))].filter(Boolean) as string[];
              setDoctorCities(uniqueCities);
              
              // Check if center param is provided - auto-select that center and skip to service
              if (centerParam) {
                const preSelectedCenter = doc.clinicCenters.find((c: any) => c.id === centerParam);
                if (preSelectedCenter) {
                  setSelectedLocation({
                    id: preSelectedCenter.id,
                    name: preSelectedCenter.name,
                    city: preSelectedCenter.city,
                    address: preSelectedCenter.address || '',
                    tier: 1,
                    centerId: preSelectedCenter.id,
                    centerName: preSelectedCenter.name,
                  });
                  setSelectedCenter(preSelectedCenter);
                  setSelectedCity(preSelectedCenter.city);
                  setSelectedMode('offline'); // Clinic visit since center is selected
                  
                  // Skip mode selection - go directly to service selection
                  setCurrentStep('service');
                  setLoadingLocations(false);
                  return;
                }
              }
              
              // If only one center, auto-select it
              if (doc.clinicCenters.length === 1) {
                const firstCenter = doc.clinicCenters[0];
                setSelectedLocation({
                  id: firstCenter.id,
                  name: firstCenter.name,
                  city: firstCenter.city,
                  address: firstCenter.address || '',
                  tier: 1,
                  centerId: firstCenter.id,
                  centerName: firstCenter.name,
                });
                setSelectedCenter(firstCenter);
                setSelectedCity(firstCenter.city);
              }
            } else if (doc.location) {
              setSelectedLocation({
                id: doc.location.id,
                name: doc.location.name,
                city: doc.location.city,
                address: '',
                tier: 1,
              });
            }
            
            // Store doctor's availability
            if (doc.weeklyAvailability) {
              setDoctorAvailability(doc.weeklyAvailability);
            }
            
            // Stay on mode selection step (unless center was pre-selected above)
            setCurrentStep('location');
            setLocationStep('mode');
          }
        } catch (err) {
          console.error('Failed to fetch doctor:', err);
        }
        
        setLoadingLocations(false);
        return; // Don't continue with normal flow
      }
      
      // NORMAL FLOW: Fetch locations and clinic centers
      try {
        // If service is pre-selected, fetch only centers that support that service
        const centersUrl = serviceParam 
          ? `/api/clinic-centers?serviceSlug=${serviceParam}`
          : '/api/clinic-centers';
        
        const [locRes, centersRes] = await Promise.all([
          fetch('/api/locations'),
          fetch(centersUrl)
        ]);
        
        const locData = await locRes.json();
        const centersData = await centersRes.json();
        
        if (locData.success) {
          setLocations(locData.data || []);
        }
        
        if (centersData.success) {
          const centers = centersData.data.centers || [];
          setClinicCenters(centers);
          setGroupedCenters(centersData.data.groupedByCity || {});
          
          // Build cities list with center counts
          const cityList = Object.entries(centersData.data.groupedByCity || {}).map(
            ([cityName, cityCenters]: [string, any]) => ({
              name: cityName,
              centerCount: cityCenters.length,
              tier: cityCenters[0]?.location?.tier || 1,
            })
          );
          setCities(cityList);
          
          // Check for pre-selected service from URL params
          if (serviceParam) {
            setIsServiceFlow(true);
            // Check if serviceParam is a category slug (matches CATEGORY_LABELS keys)
            if (CATEGORY_LABELS[serviceParam]) {
              setPreSelectedCategory(serviceParam);
              setPreSelectedServiceName(CATEGORY_LABELS[serviceParam]);
            } else {
              setPreSelectedServiceSlug(serviceParam);
              const serviceName = serviceParam.replace(/-|_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              setPreSelectedServiceName(serviceName);
            }
          }
          
          // Check for pre-selected location/center from URL params
          if (locationParam && centers.length > 0) {
            // Find the center by slug or id
            const preSelectedCenter = centers.find(
              (c: any) => c.slug === locationParam || c.id === locationParam
            );
            
            if (preSelectedCenter) {
              // Coming from location page - skip mode selection, go directly to service
              setSelectedCenter(preSelectedCenter);
              setSelectedCity(preSelectedCenter.location?.city || null);
              setSelectedMode('offline'); // Auto-set to clinic mode
              setIsLocationFlow(true); // Mark as location flow
              
              // Set location from center
              setSelectedLocation({
                id: preSelectedCenter.location?.id || preSelectedCenter.id,
                name: preSelectedCenter.location?.name || preSelectedCenter.name,
                city: preSelectedCenter.location?.city || '',
                address: preSelectedCenter.address || '',
                tier: preSelectedCenter.location?.tier || 1,
                centerId: preSelectedCenter.id,
                centerName: preSelectedCenter.name,
              });
              
              // Skip directly to service step
              setCurrentStep('service');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorParam, centerParam, serviceParam, locationParam]);

  // Fetch services when location is selected
  useEffect(() => {
    if (!selectedLocation) return;
    
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const params = new URLSearchParams();
        params.append('locationId', selectedLocation.id);
        if (selectedMode === 'online') {
          params.append('mode', 'online');
        } else if (selectedCenter?.id) {
          params.append('centerId', selectedCenter.id);
        }
        
        // Pass category filter if coming from a category page
        const categoryToFilter = preSelectedCategory || (serviceParam && CATEGORY_LABELS[serviceParam] ? serviceParam : null);
        if (categoryToFilter) {
          params.append('category', categoryToFilter);
        }
        
        const res = await fetch(`/api/services?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          const fetchedServices = data.data || [];
          setServices(fetchedServices);
          
          // Auto-select service if pre-selected from URL (only for specific service slug, not category)
          const serviceSlugToMatch = preSelectedServiceSlug;
          if (serviceSlugToMatch && fetchedServices.length > 0) {
            const normalizedParam = serviceSlugToMatch.toLowerCase().replace(/[\s_]/g, '-').replace(/-+/g, '-');
            const searchTerms = serviceSlugToMatch.toLowerCase().replace(/[-_]/g, ' ').split(' ').filter(Boolean);
            
            const matchedService = fetchedServices.find((s: Service) => {
              const slugMatch = s.slug === normalizedParam || s.slug?.includes(normalizedParam) || normalizedParam.includes(s.slug || '');
              const nameWords = s.name.toLowerCase().replace(/[&]/g, 'and').split(' ');
              const nameMatch = searchTerms.some(term => nameWords.some(word => word.includes(term) || term.includes(word)));
              return slugMatch || nameMatch;
            });
            
            if (matchedService) {
              setSelectedService(matchedService);
              setPreSelectedServiceSlug(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [selectedLocation, selectedMode, preSelectedServiceSlug, selectedCenter, serviceParam, preSelectedCategory]);

  // Fetch doctors when on doctor step with location + service selected
  useEffect(() => {
    if (currentStep !== 'doctor' || !selectedLocation || !selectedService) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const isOnline =
          selectedMode === 'online' || selectedLocation.id === 'online';

        const buildParams = (withCenter: boolean) => {
          const params = new URLSearchParams();
          params.append('locationId', isOnline ? 'online' : selectedLocation.id);
          params.append('serviceId', selectedService.id);
          if (selectedService.category) {
            params.append('category', selectedService.category);
          } else if (preSelectedCategory) {
            params.append('category', preSelectedCategory);
          }
          if (withCenter && selectedLocation.centerId && !isOnline) {
            params.append('centerId', selectedLocation.centerId);
          }
          params.append('mode', isOnline ? 'online' : selectedMode);
          return params;
        };

        const load = async (params: URLSearchParams) => {
          const res = await fetch(`/api/doctors?${params.toString()}`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success) return [];
          return data.data || [];
        };

        let list = await load(buildParams(true));
        if (list.length === 0) {
          list = await load(buildParams(false));
        }
        setDoctors(list);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [currentStep, selectedLocation, selectedService, selectedMode, preSelectedCategory]);

  // Fetch time slots when doctor, date, duration, or mode changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate || !selectedService) return;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(null); // Reset selected time when parameters change
      try {
        const params = new URLSearchParams();
        params.append('doctorId', selectedDoctor.id);
        params.append('date', format(selectedDate, 'yyyy-MM-dd'));
        params.append('serviceId', selectedService.id);
        params.append('duration', String(selectedDuration));
        params.append('mode', selectedMode === 'home_visit' ? 'offline' : selectedMode);
        
        const res = await fetch(`/api/slots?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTimeSlots(data.data.slots || []);
          // Set slot types from response
          if (data.data.slotTypes && data.data.slotTypes.length > 0) {
            setSlotTypes(data.data.slotTypes);
            // Auto-select first matching slot type if not already selected
            if (!selectedSlotType) {
              const matchingType = data.data.slotTypes.find((st: SlotTypeOption) => st.duration_minutes === selectedDuration);
              if (matchingType) {
                setSelectedSlotType(matchingType);
              }
            }
          }
          // Update selected slot type from response
          if (data.data.selectedSlotType) {
            setSelectedSlotType(data.data.selectedSlotType);
          }
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Failed to fetch time slots:', err);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctor, selectedDate, selectedService, selectedDuration, selectedMode]);

  // Dynamic steps based on flow type
  const steps: { key: BookingStep; label: string }[] = isDoctorFlow
    ? [
        { key: 'location', label: 'Mode' },
        { key: 'service', label: 'Service' },
        { key: 'datetime', label: 'Date & Time' },
        { key: 'confirm', label: 'Confirm' },
      ]
    : isServiceFlow && serviceParam && !preSelectedCategory
    ? [
        { key: 'location', label: 'Location' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'datetime', label: 'Date & Time' },
        { key: 'confirm', label: 'Confirm' },
      ]
    : isServiceFlow && preSelectedCategory
    ? [
        { key: 'location', label: 'Location' },
        { key: 'service', label: 'Service' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'datetime', label: 'Date & Time' },
        { key: 'confirm', label: 'Confirm' },
      ]
    : isLocationFlow && locationParam
    ? [
        { key: 'service', label: 'Service' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'datetime', label: 'Date & Time' },
        { key: 'confirm', label: 'Confirm' },
      ]
    : [
        { key: 'location', label: 'Location' },
        { key: 'service', label: 'Service' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'datetime', label: 'Date & Time' },
        { key: 'confirm', label: 'Confirm' },
      ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].key);
  };
  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].key);
  };

  const scrollBookingToTop = () => {
    requestAnimationFrame(() => {
      bookingFlowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /** After selecting service or doctor, jump to next step (no extra scroll to tap Continue) */
  const advanceFromStep = (stepKey: BookingStep) => {
    const idx = steps.findIndex((s) => s.key === stepKey);
    if (idx >= 0 && idx + 1 < steps.length) {
      setCurrentStep(steps[idx + 1].key);
      scrollBookingToTop();
    }
  };

  const calculatePrice = () => {
    // Use slot type price based on mode
    if (selectedSlotType) {
      if (selectedMode === 'online') {
        return selectedSlotType.online_price || selectedSlotType.price || 0;
      } else if (selectedMode === 'home_visit') {
        return selectedSlotType.home_visit_price || selectedSlotType.price || 0;
      } else {
        return selectedSlotType.offline_price || selectedSlotType.price || 0;
      }
    }
    // Fallback to service price based on location tier
    if (!selectedService || !selectedLocation) return 0;
    return selectedLocation.tier === 1 ? selectedService.tier1_price : selectedService.tier2_price;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const triggerConfetti = () => {
    confettiRef.current?.fire({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#14b8a6', '#22d3d8', '#0891b2', '#0d9488']
    });
  };

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const releaseBookingSlot = async (appointmentId: string, reason: string) => {
    try {
      await fetch('/api/payments/release-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, reason }),
      });
      if (selectedDoctor && selectedDate) {
        const params = new URLSearchParams({
          doctorId: selectedDoctor.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          duration: String(selectedDuration),
          mode: selectedMode,
        });
        if (selectedService?.id) params.set('serviceId', selectedService.id);
        const res = await fetch(`/api/slots?${params.toString()}`);
        const data = await res.json();
        if (data?.data?.slots) setTimeSlots(data.data.slots);
      }
    } catch {
      /* slot release is best-effort */
    }
  };

  // Handle booking submission and payment
  const handleBookingSubmit = async () => {
    if (bookingSubmitLockRef.current) return;
    bookingSubmitLockRef.current = true;
    setIsSubmitting(true);
    setBookingError(null);

    let checkoutOpened = false;
    let createdAppointmentId: string | null = null;

    try {
      if (!selectedLocation || !selectedService || !selectedDoctor || !selectedDate || !selectedTime) {
        throw new Error('Please complete all booking details');
      }

      // Block booking if slot has passed (today, client timezone)
      if (isSameDay(selectedDate, new Date())) {
        const [h, m] = selectedTime.split(':').map(Number);
        const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m, 0);
        if (slotDate <= new Date()) {
          setSelectedTime(null);
          throw new Error('This time slot has passed. Please select another slot.');
        }
      }

      // Validate patient details
      if (!patientName.trim()) {
        throw new Error('Please enter your full name');
      }
      if (!patientPhone || patientPhone.length !== 10) {
        setPhoneError('Please enter a valid 10-digit mobile number');
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      // Find the selected slot to get endTime
      const selectedSlot = timeSlots.find(s => s.time === selectedTime);
      const endTime = selectedSlot?.endTime || calculateEndTime(selectedTime, selectedService.duration_minutes || 30);

      // Create appointment via API
      const appointmentResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          serviceId: selectedService.id,
          locationId: selectedLocation.id,
          centerId: selectedLocation.centerId || null,
          centerName: selectedLocation.centerName || null,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedTime,
          endTime: endTime,
          mode: selectedMode,
          amount: calculatePrice(),
          notes: notes,
          patientName: patientName.trim(),
          patientPhone: `+91${patientPhone}`,
        }),
      });

      if (appointmentResponse.status === 401) {
        // Save booking state and redirect to login
        sessionStorage.setItem('pendingBooking', JSON.stringify({
          locationId: selectedLocation.id,
          serviceId: selectedService.id,
          doctorId: selectedDoctor.id,
          date: selectedDate.toISOString(),
          time: selectedTime,
          mode: selectedMode,
          notes: notes,
        }));
        bookingSubmitLockRef.current = false;
        setIsSubmitting(false);
        router.push('/login?redirect=/booking');
        return;
      }

      const appointmentData = await appointmentResponse.json();

      if (!appointmentResponse.ok) {
        throw new Error(appointmentData.error || 'Failed to create appointment');
      }

      const appointmentId = appointmentData.data?.id;
      if (!appointmentId) {
        throw new Error('Failed to create appointment');
      }
      createdAppointmentId = appointmentId;

      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        await releaseBookingSlot(appointmentId, 'order_create_failed');
        createdAppointmentId = null;
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Load Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'H2H Healthcare',
        description: selectedService.name,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              triggerConfetti();
              setTimeout(() => {
                router.push(`/booking/confirmation?appointmentId=${appointmentId}`);
              }, 1500);
            } else {
              setBookingError('Payment verification failed. Please contact support.');
            }
          } catch {
            setBookingError('Payment verification failed.');
          }
          bookingSubmitLockRef.current = false;
          setIsSubmitting(false);
        },
        prefill: {
          name: orderData.prefill?.name || '',
          email: orderData.prefill?.email || '',
          contact: orderData.prefill?.contact || '',
        },
        theme: { color: '#06b6d4' },
        modal: {
          ondismiss: () => {
            if (createdAppointmentId) {
              void releaseBookingSlot(createdAppointmentId, 'checkout_dismissed');
            }
            setBookingError('Payment cancelled. This time slot is free — you can try again or pick another slot.');
            bookingSubmitLockRef.current = false;
            setIsSubmitting(false);
          },
        },
      });
      razorpay.open();
      checkoutOpened = true;
    } catch (error) {
      console.error('Booking error:', error);
      if (createdAppointmentId) {
        await releaseBookingSlot(createdAppointmentId, 'checkout_error');
      }
      setBookingError(error instanceof Error ? error.message : 'Booking failed');
      setIsSubmitting(false);
    } finally {
      if (!checkoutOpened) {
        bookingSubmitLockRef.current = false;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <Header />
      
      <main
        ref={bookingFlowRef}
        id="booking-flow"
        className="flex-1 scroll-mt-28 mt-12 pt-24 pb-12 relative z-10"
      >
        <div className="max-w-[1100px] mx-auto px-6">
          {/* Progress Steps */}
          <div className="mb-10 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-medium transition-all',
                      index <= currentStepIndex ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-400'
                    )}>
                      {index < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={cn('hidden md:block text-[13px]', index <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400')}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn('flex-1 h-[2px] mx-3 rounded-full', index < currentStepIndex ? 'bg-cyan-500' : 'bg-gray-200')} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Step 1: Location - Enhanced with Clinic Centers */}
            {currentStep === 'location' && (
              <div>
                {/* Show loading while fetching data */}
                {loadingLocations ? (
                  <BookingLocationSkeleton />
                ) : isDoctorFlow && !selectedDoctor ? (
                  <BookingLocationSkeleton />
                ) : (
                <>
                {/* Sub-step: Mode Selection */}
                {locationStep === 'mode' && (
                  <div>
                    {/* Doctor Flow - Show doctor info and mode selection */}
                    {isDoctorFlow && selectedDoctor ? (
                      <>
                        <div className="text-center mb-8">
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <DoctorAvatar
                              name={selectedDoctor.name}
                              email={selectedDoctor.email}
                              avatar={selectedDoctor.avatar}
                              size="lg"
                              border
                            />
                            <div className="text-left">
                              <h2 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h2>
                              <p className="text-sm text-gray-500">{selectedDoctor.specializations?.slice(0, 2).join(', ')}</p>
                            </div>
                          </div>
                          <h1 className="text-[28px] md:text-[36px] font-medium text-gray-900 tracking-tight mb-3">
                            How would you like to consult?
                          </h1>
                          <p className="text-[15px] text-gray-500">
                            Choose your preferred consultation mode
                          </p>
                        </div>

                        <div className={cn(
                          "grid gap-6 max-w-3xl mx-auto",
                          selectedDoctor.offers_online && selectedDoctor.offers_clinic ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md"
                        )}>
                          {/* Online Option - Only show if doctor offers online */}
                          {selectedDoctor.offers_online && (
                            <div
                              className={cn(
                                'group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200',
                                'hover:shadow-xl hover:border-cyan-400',
                                selectedMode === 'online' 
                                  ? 'border-cyan-500 bg-cyan-50 shadow-lg' 
                                  : 'border-gray-200 bg-white'
                              )}
                              onClick={() => {
                                setSelectedMode('online');
                                setSelectedLocation({ id: 'online', name: 'Online', city: 'Online', address: 'Video Consultation', tier: 1 });
                              }}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                  <Video className="h-7 w-7 text-white" />
                                </div>
                                {selectedMode === 'online' && (
                                  <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                                )}
                              </div>
                              <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                                Online Consultation
                              </h3>
                              <p className="text-[14px] text-gray-500 mb-4">
                                Connect via secure video call from home
                              </p>
                              {/* Show slot type prices for online */}
                              {slotTypes.length > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                  {slotTypes.slice(0, 3).map((st) => (
                                    <div key={st.id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{st.label} ({st.duration_minutes} min)</span>
                                      <span className="font-semibold text-cyan-600">₹{st.online_price || st.price}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Clinic Visit Option - Only show if doctor offers clinic */}
                          {selectedDoctor.offers_clinic && (
                            <div
                              className={cn(
                                'group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200',
                                'hover:shadow-xl hover:border-cyan-400',
                                selectedMode === 'offline'
                                  ? 'border-cyan-500 bg-cyan-50 shadow-lg' 
                                  : 'border-gray-200 bg-white'
                              )}
                              onClick={() => {
                                setSelectedMode('offline');
                                // If doctor has multiple cities/centers, go to city selection
                                if (doctorCities.length > 1 || doctorClinicCenters.length > 1) {
                                  setLocationStep('city');
                                }
                                // If only one center, it's already selected
                              }}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                                  <Building2 className="h-7 w-7 text-white" />
                                </div>
                                {selectedMode === 'offline' && (
                                  <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                                )}
                              </div>
                              <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                                Visit Clinic
                              </h3>
                              <p className="text-[14px] text-gray-500 mb-4">
                                In-person consultation at clinic
                              </p>
                              {/* Show slot type prices for clinic */}
                              {slotTypes.length > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                  {slotTypes.slice(0, 3).map((st) => (
                                    <div key={st.id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{st.label} ({st.duration_minutes} min)</span>
                                      <span className="font-semibold text-teal-600">₹{st.offline_price || st.price}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Normal Flow - Generic mode selection */
                      <>
                        <div className="text-center mb-10">
                          {/* Show service info if coming from service page */}
                          {isServiceFlow && preSelectedServiceName && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full mb-4">
                              <Stethoscope className="h-4 w-4 text-cyan-600" />
                              <span className="text-sm font-medium text-cyan-700">Booking for: {preSelectedServiceName}</span>
                            </div>
                          )}
                          {/* Show center info if coming from location page */}
                          {selectedCenter && !isServiceFlow && !isDoctorFlow && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-4">
                              <Building2 className="h-4 w-4 text-teal-600" />
                              <span className="text-sm font-medium text-teal-700">{selectedCenter.name}</span>
                            </div>
                          )}
                          <h1 className="text-[32px] md:text-[40px] font-medium text-gray-900 tracking-tight mb-3">
                            How would you like to consult?
                          </h1>
                          <p className="text-[15px] text-gray-500">
                            {isServiceFlow 
                              ? `Choose your preferred consultation mode for ${preSelectedServiceName}`
                              : selectedCenter
                                ? `Choose Online for all services, or Visit Clinic for ${selectedCenter.name} services`
                                : 'Choose your preferred consultation mode'
                            }
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                          {/* Online Option */}
                          <div
                            className={cn(
                              'group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200',
                              'hover:shadow-xl hover:border-cyan-400',
                              selectedMode === 'online' 
                                ? 'border-cyan-500 bg-cyan-50 shadow-lg' 
                                : 'border-gray-200 bg-white'
                            )}
                            onClick={async () => {
                              setSelectedMode('online');
                              setSelectedCenter(null); // Clear center for online - no center filtering
                              const onlineLocation = { id: 'online', name: 'Online', city: 'Online', address: 'Video Consultation from anywhere', tier: 1 };
                              setSelectedLocation(onlineLocation);
                              
                              // If service is pre-selected from URL
                              if (serviceParam) {
                                // If it's a category, go to service step (services will be fetched by useEffect with category filter)
                                if (CATEGORY_LABELS[serviceParam]) {
                                  setCurrentStep('service');
                                } else {
                                  // Specific service slug - try to match and skip to doctor
                                  setLoadingServices(true);
                                  try {
                                    const res = await fetch(`/api/services?locationId=online&mode=online`);
                                    const data = await res.json();
                                    if (data.success && data.data.length > 0) {
                                      const fetchedServices = data.data;
                                      setServices(fetchedServices);
                                      
                                      const normalizedParam = serviceParam.toLowerCase().replace(/[\s_]/g, '-').replace(/-+/g, '-');
                                      const searchTerms = serviceParam.toLowerCase().replace(/[-_]/g, ' ').split(' ').filter(Boolean);
                                      
                                      const matchedService = fetchedServices.find((s: Service) => {
                                        const slugMatch = s.slug === normalizedParam || s.slug?.includes(normalizedParam) || normalizedParam.includes(s.slug || '');
                                        const nameWords = s.name.toLowerCase().replace(/[&]/g, 'and').split(' ');
                                        const nameMatch = searchTerms.some(term => nameWords.some(word => word.includes(term) || term.includes(word)));
                                        return slugMatch || nameMatch;
                                      });
                                      
                                      if (matchedService) {
                                        setSelectedService(matchedService);
                                        
                                        setLoadingDoctors(true);
                                        try {
                                          const doctorParams = new URLSearchParams();
                                          doctorParams.append('locationId', 'online');
                                          doctorParams.append('serviceId', matchedService.id);
                                          doctorParams.append('mode', 'online');
                                          
                                          const doctorRes = await fetch(`/api/doctors?${doctorParams.toString()}`);
                                          const doctorData = await doctorRes.json().catch(() => ({}));
                                          if (!doctorRes.ok) {
                                            console.warn('Doctors fetch failed:', doctorRes.status, doctorData?.error);
                                          } else if (doctorData.success) {
                                            setDoctors(doctorData.data || []);
                                          }
                                        } catch (err) {
                                          console.error('Failed to fetch doctors:', err);
                                        } finally {
                                          setLoadingDoctors(false);
                                        }
                                        
                                        setCurrentStep('doctor');
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Failed to fetch services:', err);
                                  } finally {
                                    setLoadingServices(false);
                                  }
                                }
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                <Video className="h-7 w-7 text-white" />
                              </div>
                              {selectedMode === 'online' && (
                                <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                              )}
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                              Online Consultation
                            </h3>
                            <p className="text-[14px] text-gray-500 mb-4">
                              Connect with our specialists via secure video call from the comfort of your home
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-cyan-100 text-cyan-700 border-0 text-[11px]">
                                <Globe className="h-3 w-3 mr-1" />
                                Available Anywhere
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 border-0 text-[11px]">
                                No Travel
                              </Badge>
                            </div>
                          </div>

                          {/* Clinic Visit Option - Only show if there are cities/centers available */}
                          {(cities.length > 0 || clinicCenters.length > 0 || selectedCenter) && (
                          <div
                            className={cn(
                              'group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200',
                              'hover:shadow-xl hover:border-cyan-400',
                              selectedMode === 'offline' && selectedCenter
                                ? 'border-cyan-500 bg-cyan-50 shadow-lg' 
                                : 'border-gray-200 bg-white'
                            )}
                            onClick={async () => {
                              setSelectedMode('offline');
                              // If center is already pre-selected (from location page), set location and don't go to city selection
                              if (selectedCenter) {
                                // Set location from pre-selected center
                                const centerLocation = {
                                  id: selectedCenter.location?.id || selectedCenter.id,
                                  name: selectedCenter.location?.name || selectedCenter.name,
                                  city: selectedCenter.location?.city || '',
                                  address: selectedCenter.address || '',
                                  tier: selectedCenter.location?.tier || 1,
                                  centerId: selectedCenter.id,
                                  centerName: selectedCenter.name,
                                };
                                setSelectedLocation(centerLocation);
                                
                                // If service is pre-selected from URL, fetch services and auto-select, then skip to doctor
                                if (serviceParam) {
                                  setLoadingServices(true);
                                  try {
                                    const res = await fetch(`/api/services?locationId=${centerLocation.id}&centerId=${selectedCenter.id}`);
                                    const data = await res.json();
                                    if (data.success && data.data.length > 0) {
                                      const fetchedServices = data.data;
                                      setServices(fetchedServices);
                                      
                                      // Dynamic matching - normalize the URL param and match against service slug/name
                                      const normalizedParam = serviceParam.toLowerCase().replace(/[\s_]/g, '-').replace(/-+/g, '-');
                                      const searchTerms = serviceParam.toLowerCase().replace(/[-_]/g, ' ').split(' ').filter(Boolean);
                                      
                                      const matchedService = fetchedServices.find((s: Service) => {
                                        const slugMatch = s.slug === normalizedParam || s.slug?.includes(normalizedParam) || normalizedParam.includes(s.slug || '');
                                        const nameWords = s.name.toLowerCase().replace(/[&]/g, 'and').split(' ');
                                        const nameMatch = searchTerms.some(term => nameWords.some(word => word.includes(term) || term.includes(word)));
                                        return slugMatch || nameMatch;
                                      });
                                      
                                      if (matchedService) {
                                        setSelectedService(matchedService);
                                        
                                        // Also fetch doctors immediately to avoid inconsistent loading
                                        setLoadingDoctors(true);
                                        try {
                                          const doctorParams = new URLSearchParams();
                                          doctorParams.append('locationId', centerLocation.id);
                                          doctorParams.append('serviceId', matchedService.id);
                                          doctorParams.append('centerId', selectedCenter.id);
                                          
                                          const doctorRes = await fetch(`/api/doctors?${doctorParams.toString()}`);
                                          const doctorData = await doctorRes.json().catch(() => ({}));
                                          if (!doctorRes.ok) {
                                            console.warn('Doctors fetch failed:', doctorRes.status, doctorData?.error);
                                          } else if (doctorData.success) {
                                            setDoctors(doctorData.data || []);
                                          }
                                        } catch (err) {
                                          console.error('Failed to fetch doctors:', err);
                                        } finally {
                                          setLoadingDoctors(false);
                                        }
                                        
                                        setCurrentStep('doctor'); // Skip directly to doctor step
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Failed to fetch services:', err);
                                  } finally {
                                    setLoadingServices(false);
                                  }
                                }
                              } else {
                                setLocationStep('city');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                                <Building2 className="h-7 w-7 text-white" />
                              </div>
                              {selectedMode === 'offline' && selectedCenter && (
                                <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                              )}
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                              {selectedCenter ? `Visit ${selectedCenter.name}` : 'Visit a Clinic'}
                            </h3>
                            <p className="text-[14px] text-gray-500 mb-4">
                              {selectedCenter 
                                ? `In-person consultation at ${selectedCenter.name} - only services available at this center`
                                : 'Visit one of our state-of-the-art clinics for in-person consultation and treatment'
                              }
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCenter ? (
                                <Badge className="bg-teal-100 text-teal-700 border-0 text-[11px]">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {selectedCenter.location?.city || selectedCity}
                                </Badge>
                              ) : (
                                <>
                                  <Badge className="bg-teal-100 text-teal-700 border-0 text-[11px]">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {cities.length} Cities
                                  </Badge>
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[11px]">
                                    {clinicCenters.length}+ Centers
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Selected Center Summary */}
                    {selectedCenter && selectedMode === 'offline' && (
                      <div className="mt-6 p-4 bg-cyan-50 rounded-xl border border-cyan-200 max-w-3xl mx-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-cyan-600" />
                            <div>
                              <p className="text-[14px] font-medium text-gray-900">{selectedCenter.name}</p>
                              <p className="text-[12px] text-gray-500">{selectedCenter.address}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocationStep('city')}
                            className="text-[12px]"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Continue button */}
                    <div className="flex justify-center mt-10">
                      <Button 
                        onClick={() => {
                          // If service is already selected (from URL param), skip to doctor step
                          if (selectedService) {
                            setCurrentStep('doctor');
                          } else {
                            goToNextStep();
                          }
                        }}
                        disabled={!selectedLocation}
                        className="h-12 px-10 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full text-[15px] font-medium shadow-lg disabled:opacity-50"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sub-step: City Selection */}
                {locationStep === 'city' && (
                  <div>
                    <div className="text-center mb-8">
                      {isDoctorFlow && selectedDoctor && (
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <DoctorAvatar
                            name={selectedDoctor.name}
                            email={selectedDoctor.email}
                            avatar={selectedDoctor.avatar}
                            size="sm"
                            border
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{selectedDoctor.name}</p>
                            <p className="text-xs text-gray-500">Select clinic location</p>
                          </div>
                        </div>
                      )}
                      {/* Show service info if coming from service page */}
                      {isServiceFlow && preSelectedServiceName && !isDoctorFlow && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full mb-4">
                          <Stethoscope className="h-4 w-4 text-cyan-600" />
                          <span className="text-sm font-medium text-cyan-700">{preSelectedServiceName}</span>
                        </div>
                      )}
                      <h1 className="text-[28px] md:text-[36px] font-medium text-gray-900 tracking-tight mb-3">
                        {isDoctorFlow ? 'Select Clinic Location' : 'Select Your City'}
                      </h1>
                      <p className="text-[15px] text-gray-500">
                        {isDoctorFlow 
                          ? `Choose where you'd like to visit ${selectedDoctor?.name?.split(' ')[0] || 'the doctor'}`
                          : isServiceFlow
                            ? `Cities with clinics offering ${preSelectedServiceName}`
                            : 'Choose a city to view available clinic centers'
                        }
                      </p>
                    </div>

                    {/* Doctor Flow - Show doctor's cities/centers */}
                    {isDoctorFlow && doctorCities.length > 0 ? (
                      <div className="max-w-2xl mx-auto">
                        {/* If multiple cities, show city selection first */}
                        {doctorCities.length > 1 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            {doctorCities.map((cityName) => {
                              const centersInCity = doctorClinicCenters.filter(c => c.city === cityName);
                              return (
                                <div
                                  key={cityName}
                                  className={cn(
                                    'cursor-pointer p-4 rounded-xl border-2 transition-all',
                                    'hover:shadow-lg hover:border-cyan-400',
                                    selectedCity === cityName
                                      ? 'border-cyan-500 bg-cyan-50'
                                      : 'border-gray-200 bg-white'
                                  )}
                                  onClick={() => {
                                    setSelectedCity(cityName);
                                    // If only one center in this city, auto-select it
                                    if (centersInCity.length === 1) {
                                      const center = centersInCity[0];
                                      setSelectedCenter(center);
                                      setSelectedLocation({
                                        id: center.location_id || center.location?.id || center.id,
                                        name: center.name,
                                        city: center.city,
                                        address: center.address || '',
                                        tier: center.location?.tier || 1,
                                        centerId: center.id,
                                        centerName: center.name,
                                      });
                                    } else {
                                      setSelectedCenter(null);
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <MapPin className="h-5 w-5 text-cyan-500" />
                                    {selectedCity === cityName && <CheckCircle2 className="h-5 w-5 text-cyan-500" />}
                                  </div>
                                  <h3 className="font-semibold text-gray-900">{cityName}</h3>
                                  <p className="text-xs text-gray-500">{centersInCity.length} center{centersInCity.length > 1 ? 's' : ''}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {/* Show centers for selected city (or all if single city) */}
                        {(selectedCity || doctorCities.length === 1) && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              {doctorCities.length > 1 ? `Centers in ${selectedCity}` : 'Available Centers'}
                            </p>
                            {doctorClinicCenters
                              .filter(c => doctorCities.length === 1 || c.city === selectedCity)
                              .map((center) => (
                                <div
                                  key={center.id}
                                  className={cn(
                                    'cursor-pointer p-4 rounded-xl border-2 transition-all',
                                    'hover:shadow-lg hover:border-cyan-400',
                                    selectedCenter?.id === center.id
                                      ? 'border-cyan-500 bg-cyan-50'
                                      : 'border-gray-200 bg-white'
                                  )}
                                  onClick={() => {
                                    setSelectedCenter(center);
                                    setSelectedCity(center.city);
                                    setSelectedLocation({
                                      id: center.location_id || center.location?.id || center.id,
                                      name: center.name,
                                      city: center.city,
                                      address: center.address || '',
                                      tier: center.location?.tier || 1,
                                      centerId: center.id,
                                      centerName: center.name,
                                    });
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Building2 className="h-5 w-5 text-teal-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{center.name}</h4>
                                        <p className="text-sm text-gray-500">{center.address}</p>
                                        {center.phone && (
                                          <p className="text-xs text-gray-400 mt-1">{center.phone}</p>
                                        )}
                                      </div>
                                    </div>
                                    {selectedCenter?.id === center.id && (
                                      <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Continue/Back buttons for doctor flow */}
                        <div className="flex justify-between mt-8">
                          <Button 
                            variant="outline" 
                            onClick={() => setLocationStep('mode')}
                            className="h-11 px-6 rounded-full"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                          </Button>
                          <Button 
                            onClick={goToNextStep}
                            disabled={!selectedCenter}
                            className="h-11 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full disabled:opacity-50"
                          >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : loadingLocations ? (
                      <BookingCityGridSkeleton />
                    ) : cities.length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <AlertCircle className="h-14 w-14 mx-auto mb-4 text-gray-300" />
                        <p className="text-[16px]">No clinic locations available at the moment.</p>
                        <p className="text-[14px] mt-2">Please try online consultation instead.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cities.sort((a, b) => a.tier - b.tier || b.centerCount - a.centerCount).map((city) => (
                          <div
                            key={city.name}
                            className={cn(
                              'group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200',
                              'hover:shadow-xl hover:scale-[1.02]',
                              selectedCity === city.name 
                                ? 'ring-3 ring-cyan-500 shadow-lg' 
                                : 'shadow-md'
                            )}
                            onClick={() => {
                              setSelectedCity(city.name);
                              setSelectedCenter(null);
                              setLocationStep('center');
                            }}
                          >
                            <div className="relative h-32 bg-gradient-to-br from-cyan-500 to-teal-600">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                              
                              {selectedCity === city.name && (
                                <div className="absolute top-3 right-3">
                                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              )}

                              <div className="absolute top-3 left-3">
                                <Badge 
                                  className={cn(
                                    "text-[10px] font-medium border-0",
                                    city.tier === 1 
                                      ? 'bg-cyan-500 text-white' 
                                      : 'bg-teal-500 text-white'
                                  )}
                                >
                                  Tier {city.tier}
                                </Badge>
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-white font-semibold text-[16px] mb-1">
                                  {city.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-white/80 text-[12px]">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>{city.centerCount} center{city.centerCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Back button only for non-doctor flow (doctor flow has its own Back button above) */}
                    {!isDoctorFlow && (
                      <div className="flex justify-between mt-10">
                        <Button 
                          variant="outline" 
                          onClick={() => setLocationStep('mode')}
                          className="h-11 px-6 rounded-full"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-step: Center Selection */}
                {locationStep === 'center' && (
                  <div>
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge className="bg-cyan-100 text-cyan-700 border-0">
                          <MapPin className="h-3 w-3 mr-1" />
                          {selectedCity}
                        </Badge>
                      </div>
                      <h1 className="text-[28px] md:text-[36px] font-medium text-gray-900 tracking-tight mb-3">
                        Choose a Clinic Center
                      </h1>
                      <p className="text-[15px] text-gray-500">
                        Select from {(groupedCenters[selectedCity || ''] || []).length} center{(groupedCenters[selectedCity || ''] || []).length !== 1 ? 's' : ''} in {selectedCity}
                      </p>
                    </div>

                    {(groupedCenters[selectedCity || ''] || []).length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <Building2 className="h-14 w-14 mx-auto mb-4 text-gray-300" />
                        <p className="text-[16px]">No centers available in {selectedCity}.</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setLocationStep('city')}
                          className="mt-4"
                        >
                          Choose Another City
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(groupedCenters[selectedCity || ''] || [])
                          .sort((a: any, b: any) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.rating || 0) - (a.rating || 0))
                          .map((center: any) => (
                          <div
                            key={center.id}
                            className={cn(
                              'group relative cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-200',
                              'hover:shadow-lg hover:border-cyan-200',
                              selectedCenter?.id === center.id 
                                ? 'border-cyan-500 ring-2 ring-cyan-100 shadow-lg' 
                                : 'border-gray-200'
                            )}
                            onClick={() => {
                              setSelectedCenter(center);
                              setSelectedLocation({
                                id: center.location?.id || center.id,
                                name: center.location?.city || selectedCity || '',
                                city: center.location?.city || selectedCity || '',
                                address: center.address,
                                tier: center.location?.tier || 1,
                                centerId: center.id,
                                centerName: center.name,
                              });
                              setSelectedMode('offline');
                            }}
                          >
                            {/* Featured Badge */}
                            {center.is_featured && (
                              <div className="absolute -top-2 -right-2 z-10">
                                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              </div>
                            )}

                            {/* Selection Indicator */}
                            {selectedCenter?.id === center.id && (
                              <div className="absolute top-4 right-4">
                                <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                              </div>
                            )}

                            {/* Header */}
                            <div className="mb-4">
                              <h3 className="text-[17px] font-semibold text-gray-900 pr-8 mb-2">
                                {center.name}
                              </h3>
                              
                              {/* Status Badge */}
                              <div className="flex items-center gap-2 mb-3">
                                {center.isOpenNow ? (
                                  <Badge className="bg-green-100 text-green-700 border-0 text-[11px]">
                                    Open Now
                                  </Badge>
                                ) : center.todayAvailability?.isOpen ? (
                                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[11px]">
                                    Opens at {center.todayAvailability.openTime}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-600 border-0 text-[11px]">
                                    {center.nextOpenDay ? `Opens ${center.nextOpenDay}` : 'Closed Today'}
                                  </Badge>
                                )}
                                
                                {center.availableSlots > 0 && (
                                  <Badge className="bg-cyan-50 text-cyan-700 border-0 text-[11px]">
                                    <Users className="h-3 w-3 mr-1" />
                                    {center.availableSlots} slots
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-2 text-[13px] text-gray-500 mb-3">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-600" />
                              <div>
                                <span className="line-clamp-2">{center.address}</span>
                                {center.landmark && (
                                  <span className="text-gray-400 text-[12px]"> • {center.landmark}</span>
                                )}
                              </div>
                            </div>

                            {/* Timing */}
                            {center.todayAvailability && (
                              <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-3">
                                <Clock className="h-4 w-4 flex-shrink-0 text-cyan-600" />
                                <span>
                                  {center.todayAvailability.openTime} - {center.todayAvailability.closeTime}
                                </span>
                              </div>
                            )}

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-400 fill-current" />
                                <span className="text-[14px] font-medium text-gray-900">
                                  {center.rating?.toFixed(1) || '4.5'}
                                </span>
                              </div>
                              <span className="text-[12px] text-gray-400">
                                ({center.total_reviews || 0} reviews)
                              </span>
                            </div>

                            {/* Facilities */}
                            {center.facilities && center.facilities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {center.facilities.slice(0, 3).map((facility: string, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-[10px] text-gray-500 border-gray-200 bg-gray-50"
                                  >
                                    {facility}
                                  </Badge>
                                ))}
                                {center.facilities.length > 3 && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[10px] text-gray-500 border-gray-200 bg-gray-50"
                                  >
                                    +{center.facilities.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Select Button */}
                            <Button
                              variant={selectedCenter?.id === center.id ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "w-full mt-2 rounded-full text-[13px]",
                                selectedCenter?.id === center.id 
                                  ? "bg-cyan-500 hover:bg-cyan-600 text-white" 
                                  : "border-gray-200 hover:border-cyan-300 hover:bg-cyan-50"
                              )}
                            >
                              {selectedCenter?.id === center.id ? 'Selected' : 'Select This Center'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Week Availability for Selected Center */}
                    {selectedCenter && selectedCenter.availability && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
                        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">
                          {selectedCenter.name} - Weekly Schedule
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                          {(selectedCenter.availability || []).map((avail: any) => {
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const today = new Date().getDay();
                            return (
                              <div
                                key={avail.day_of_week}
                                className={cn(
                                  'flex flex-col items-center p-3 rounded-xl text-center transition-all',
                                  avail.is_open 
                                    ? 'bg-gradient-to-b from-green-50 to-emerald-50 border border-green-200' 
                                    : 'bg-gray-50 border border-gray-100',
                                  avail.day_of_week === today && 'ring-2 ring-cyan-400'
                                )}
                              >
                                <span className={cn(
                                  'text-[11px] font-semibold mb-1',
                                  avail.is_open ? 'text-gray-700' : 'text-gray-400'
                                )}>
                                  {dayNames[avail.day_of_week]}
                                </span>
                                
                                {avail.is_open ? (
                                  <>
                                    <span className="text-[10px] text-gray-500">
                                      {avail.open_time?.substring(0, 5)}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {avail.close_time?.substring(0, 5)}
                                    </span>
                                    <Badge 
                                      className={cn(
                                        'mt-2 text-[9px] border-0',
                                        (avail.max_appointments - (avail.current_bookings || 0)) > 10 
                                          ? 'bg-green-100 text-green-700'
                                          : (avail.max_appointments - (avail.current_bookings || 0)) > 0
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-red-100 text-red-700'
                                      )}
                                    >
                                      {Math.max(0, avail.max_appointments - (avail.current_bookings || 0))} slots
                                    </Badge>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-gray-400 mt-2">Closed</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-10">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedCenter(null);
                          setLocationStep('city');
                        }}
                        className="h-11 px-6 rounded-full"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cities
                      </Button>
                      <Button 
                        onClick={() => {
                          setLocationStep('mode');
                        }}
                        disabled={!selectedCenter}
                        className="h-11 px-8 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full text-[14px] font-medium disabled:opacity-50"
                      >
                        Confirm Center
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}

            {/* Step 2: Service */}
            {currentStep === 'service' && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-[32px] md:text-[40px] font-medium text-gray-900 tracking-tight mb-3">Select a Service</h1>
                  <p className="text-[15px] text-gray-500">
                    {isDoctorFlow && selectedDoctor 
                      ? <>Services offered by <span className="text-cyan-600 font-medium">{selectedDoctor.name}</span></>
                      : <>Choose the <span className="text-cyan-600 font-medium">treatment</span> you need</>
                    }
                  </p>
                </div>

                {/* Category filter tabs - only when not doctor flow and multiple categories exist */}
                {(() => {
                  const baseServices = isDoctorFlow && doctorServices.length > 0 ? doctorServices : services;
                  const categories = [...new Set(baseServices.map((s) => s.category).filter(Boolean))];
                  const hasMultipleCategories = categories.length > 1 && !isDoctorFlow;
                  if (!hasMultipleCategories) return null;
                  return (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <button
                        onClick={() => setSelectedServiceCategory(null)}
                        className={cn(
                          'px-4 py-2.5 text-sm font-medium transition-all rounded-lg border',
                          selectedServiceCategory === null
                            ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-200 hover:bg-cyan-50/50'
                        )}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedServiceCategory(cat)}
                          className={cn(
                            'px-4 py-2.5 text-sm font-medium transition-all rounded-lg border',
                            selectedServiceCategory === cat
                              ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-200 hover:bg-cyan-50/50'
                          )}
                        >
                          {CATEGORY_LABELS[cat] || cat}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Use doctor's services when in doctor flow, otherwise use location-based services */}
                {(() => {
                  const baseServices = isDoctorFlow && doctorServices.length > 0 ? doctorServices : services;
                  const displayServices = selectedServiceCategory
                    ? baseServices.filter((s) => s.category === selectedServiceCategory)
                    : baseServices;
                  const isLoading = isDoctorFlow ? false : loadingServices;
                  
                  if (isLoading) {
                    return <BookingServiceSkeleton />;
                  }
                  
                  if (displayServices.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No services available{isDoctorFlow ? ' for this doctor' : ' for this location'}.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {displayServices.map((service) => (
                        <div
                          key={service.id}
                          className={cn(
                            'group cursor-pointer p-4 md:p-5 rounded-xl border bg-white transition-all hover:shadow-lg',
                            selectedService?.id === service.id ? 'border-cyan-500' : 'border-gray-200'
                          )}
                          onClick={() => {
                            setSelectedService(service);
                            advanceFromStep('service');
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Badge className="bg-gray-100 text-gray-600 border-0 text-[11px]">
                              {CATEGORY_LABELS[service.category] || service.category}
                            </Badge>
                            {selectedService?.id === service.id && <CheckCircle2 className="h-5 w-5 text-cyan-500" />}
                          </div>
                          <h3 className="text-[17px] font-semibold text-gray-900 mb-2">{service.name}</h3>
                          <p className="text-[13px] text-gray-500 line-clamp-2 mb-4">{service.description || 'Professional treatment service'}</p>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-[12px] text-gray-400">
                              <Clock className="h-3.5 w-3.5" /> {service.duration_minutes || 30} mins
                            </div>
{/* Price hidden from service selection - shown at confirmation */}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-between mt-10">
                  {/* Hide Back button if this is the first step (location flow skips to service) */}
                  {currentStepIndex > 0 ? (
                    <Button variant="outline" onClick={goToPrevStep} className="h-11 px-6 rounded-full">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button onClick={goToNextStep} disabled={!selectedService} className="h-11 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full disabled:opacity-50">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Doctor */}
            {currentStep === 'doctor' && (
              <div>
                <div className="text-center mb-10">
                  <h1 className="text-[32px] md:text-[40px] font-medium text-gray-900 tracking-tight mb-3">Choose Your Doctor</h1>
                  <p className="text-[15px] text-gray-500">Select a <span className="text-cyan-600 font-medium">specialist</span> for your treatment</p>
                </div>

                {loadingDoctors ? (
                  <BookingDoctorSkeleton />
                ) : doctors.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No doctors available for this service. Please select a different service.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className={cn(
                          'group cursor-pointer p-4 md:p-5 rounded-xl border bg-white transition-all hover:shadow-lg',
                          selectedDoctor?.id === doctor.id ? 'border-cyan-500' : 'border-gray-200'
                        )}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          advanceFromStep('doctor');
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <DoctorAvatar
                            name={doctor.name}
                            email={doctor.email}
                            avatar={doctor.avatar}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-[16px] font-semibold text-gray-900 truncate">{doctor.name}</h3>
                              {selectedDoctor?.id === doctor.id && <CheckCircle2 className="h-5 w-5 text-cyan-500 flex-shrink-0 ml-2" />}
                            </div>
                            <p className="text-[12px] text-gray-500 mb-2">{doctor.specializations?.join(', ') || 'Specialist'}</p>
                            <div className="flex items-center gap-3 text-[12px]">
                              <span className="text-gray-400">{doctor.experience_years} yrs</span>
                              <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <Star className="h-3 w-3 fill-current" /> {doctor.rating?.toFixed(1) || '5.0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-10">
                  {/* Hide Back button if this is the first step (service flow skips to doctor) */}
                  {currentStepIndex > 0 ? (
                    <Button variant="outline" onClick={goToPrevStep} className="h-11 px-6 rounded-full">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button onClick={goToNextStep} disabled={!selectedDoctor} className="h-11 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full disabled:opacity-50">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Date & Time */}
            {currentStep === 'datetime' && (
              <div className="max-w-4xl mx-auto">
                {/* Compact Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1">Schedule Appointment</h1>
                  <p className="text-sm text-gray-500">with <span className="text-cyan-600 font-medium">{selectedDoctor?.name}</span></p>
                </div>

                {/* Top Bar - Mode & Duration in one row */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Mode Selection - Pill buttons */}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mode</p>
                      <div className="flex gap-2">
                        {selectedService?.online_available && selectedDoctor?.offers_online !== false && selectedDoctor?.google_meet_enabled && (
                          <button
                            onClick={() => setSelectedMode('online')}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                              selectedMode === 'online' 
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <Video className="h-3.5 w-3.5" /> Online
                          </button>
                        )}
                        {selectedService?.offline_available && selectedDoctor?.offers_clinic !== false && (
                          <button
                            onClick={() => setSelectedMode('offline')}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                              selectedMode === 'offline' 
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <Building2 className="h-3.5 w-3.5" /> Clinic
                          </button>
                        )}
                        {selectedService?.home_visit_available && selectedDoctor?.offers_home_visit && (
                          <button
                            onClick={() => setSelectedMode('home_visit')}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                              selectedMode === 'home_visit' 
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            <Home className="h-3.5 w-3.5" /> Home
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-12 bg-gray-200"></div>

                    {/* Duration Selection - Horizontal pills */}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Duration</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {slotTypes.length > 0 ? slotTypes.map((slotType) => {
                          const displayPrice = selectedMode === 'online' 
                            ? (slotType.online_price || slotType.price)
                            : selectedMode === 'home_visit'
                              ? (slotType.home_visit_price || slotType.price)
                              : (slotType.offline_price || slotType.price);
                          
                          return (
                            <button
                              key={slotType.id}
                              onClick={() => {
                                setSelectedDuration(slotType.duration_minutes);
                                setSelectedSlotType(slotType);
                              }}
                              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                selectedDuration === slotType.duration_minutes 
                                  ? 'bg-cyan-500 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              {slotType.duration_minutes}m
                              <span className={selectedDuration === slotType.duration_minutes ? 'text-cyan-100' : 'text-gray-400'}>₹{displayPrice}</span>
                            </button>
                          );
                        }) : (
                          [15, 30, 45, 60].map((duration) => (
                            <button
                              key={duration}
                              onClick={() => setSelectedDuration(duration)}
                              className={cn("px-3 py-2 rounded-full text-xs font-medium transition-all",
                                selectedDuration === duration 
                                  ? 'bg-cyan-500 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              {duration}m
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content - Calendar & Time Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Calendar */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-semibold text-gray-900">Select Date</h3>
                      {selectedDate && (
                        <span className="text-[13px] bg-cyan-500 text-white px-3 py-1 rounded-full font-medium">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        disabled={(date) => isBefore(date, startOfToday()) || isBefore(addDays(new Date(), 30), date)}
                        className="!w-full max-w-[340px] mx-auto [--cell-size:2.25rem] [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-day]:text-[13px] [&_.rdp-day]:min-h-[var(--cell-size)] [&_.rdp-day]:min-w-[var(--cell-size)] [&_.rdp-weekday]:text-[11px] [&_.rdp-weekday]:text-gray-400 [&_.rdp-weekday]:min-h-[var(--cell-size)] [&_.rdp-weekday]:min-w-[var(--cell-size)] [&_.rdp-caption_label]:text-[14px] [&_.rdp-caption_label]:font-medium"
                      />
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[14px] font-semibold text-gray-900">Available Times</h3>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date first'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                        <span className="text-[11px] text-gray-500">{selectedDuration} min</span>
                      </div>
                    </div>
                    
                    {!selectedDate ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <CalendarDays className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="text-sm">Select a date to view available times</p>
                      </div>
                    ) : loadingSlots ? (
                      <BookingTimeSlotGridSkeleton />
                    ) : timeSlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Clock className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="text-sm">No slots available for this date</p>
                      </div>
                    ) : (
                      <>
                        {timeSlots.filter((s) => {
                          if (!s.available) return false;
                          const isToday = selectedDate && isSameDay(selectedDate, new Date());
                          if (!isToday || !selectedDate) return true;
                          const [h, m] = s.time.split(':').map(Number);
                          const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m, 0);
                          return slotDate > new Date();
                        }).length === 0 && (
                          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-xs text-amber-600">All slots for this date are booked or have passed. Try another date.</p>
                          </div>
                        )}
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[280px] overflow-y-auto p-1">
                          {timeSlots.map((slot) => {
                            const isTodaySelected = selectedDate && isSameDay(selectedDate, new Date());
                            const [h, m] = slot.time.split(':').map(Number);
                            const slotDate = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m, 0) : null;
                            const isExpired = isTodaySelected && slotDate && slotDate <= new Date();
                            const isDisabled = !slot.available || isExpired;
                            return (
                              <button
                                key={slot.time}
                                disabled={isDisabled}
                                className={cn(
                                  "py-2 px-1 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center min-h-[48px]",
                                  isDisabled
                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                    : selectedTime === slot.time
                                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md ring-2 ring-cyan-300 ring-offset-1'
                                      : 'bg-gray-50 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 border border-gray-100'
                                )}
                                onClick={() => !isDisabled && setSelectedTime(slot.time)}
                              >
                                <span>{slot.time}</span>
                                {isExpired && (
                                  <span className="text-[9px] text-gray-400 font-normal">Expired</span>
                                )}
                                {!slot.available && !isExpired && (
                                  <span className="text-[9px] text-gray-400 font-normal">Booked</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Summary Bar */}
                <div className="mt-4 bg-gradient-to-r from-gray-50 to-cyan-50/30 rounded-2xl border border-gray-100 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedSlotType && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                            {selectedMode === 'online' ? <Video className="h-5 w-5 text-cyan-600" /> : 
                             selectedMode === 'home_visit' ? <Home className="h-5 w-5 text-cyan-600" /> :
                             <Building2 className="h-5 w-5 text-cyan-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedMode === 'online' ? 'Online' : selectedMode === 'home_visit' ? 'Home Visit' : 'Clinic'} • {selectedDuration} min
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedDate && selectedTime ? `${format(selectedDate, 'EEE, MMM d')} at ${selectedTime}` : 'Select date & time'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedSlotType && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-600">
                            ₹{selectedMode === 'online' 
                              ? (selectedSlotType.online_price || selectedSlotType.price)
                              : selectedMode === 'home_visit'
                                ? (selectedSlotType.home_visit_price || selectedSlotType.price)
                                : (selectedSlotType.offline_price || selectedSlotType.price)}
                          </p>
                          {selectedMode === 'home_visit' && selectedSlotType.home_visit_additional_charge && (
                            <p className="text-[10px] text-orange-500">incl. ₹{selectedSlotType.home_visit_additional_charge} travel</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPrevStep} className="h-11 px-6 rounded-full border-gray-200">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    onClick={goToNextStep} 
                    disabled={!selectedDate || !selectedTime} 
                    className="h-11 px-8 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full disabled:opacity-50 shadow-lg"
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Confirm */}
            {currentStep === 'confirm' && (
              <div>
                <div className="text-center mb-10">
                  <h1 className="text-[32px] md:text-[40px] font-medium text-gray-900 tracking-tight mb-3">Confirm Your Booking</h1>
                  <p className="text-[15px] text-gray-500">Review your <span className="text-cyan-600 font-medium">appointment details</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="p-4 md:p-6 rounded-xl border border-gray-200 bg-white">
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-gray-900 mb-4 md:mb-6">Appointment Summary</h3>
                    <div className="space-y-2 md:space-y-4">
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Location</span>
                        <div className="text-right">
                          <span className="text-[13px] md:text-[14px] font-medium text-gray-900 block">
                            {selectedMode === 'online' ? 'Online' : selectedLocation?.centerName || selectedLocation?.city}
                          </span>
                          {selectedMode !== 'online' && selectedLocation?.centerName && (
                            <span className="text-[11px] text-gray-500">{selectedLocation?.city}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Service</span>
                        <span className="text-[13px] md:text-[14px] font-medium text-gray-900 text-right max-w-[60%] truncate">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Doctor</span>
                        <span className="text-[13px] md:text-[14px] font-medium text-gray-900">{selectedDoctor?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Date</span>
                        <span className="text-[13px] md:text-[14px] font-medium text-gray-900">{selectedDate && format(selectedDate, 'EEE, MMM d')}</span>
                      </div>
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Time</span>
                        <span className="text-[13px] md:text-[14px] font-medium text-gray-900">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                        <span className="text-[12px] md:text-[13px] text-gray-500">Mode</span>
                        <span className="text-[13px] md:text-[14px] font-medium text-gray-900 flex items-center gap-1 md:gap-2">
                          {selectedMode === 'online' && <Video className="h-3 w-3 md:h-4 md:w-4 text-cyan-600" />}
                          {selectedMode === 'offline' && <Building2 className="h-3 w-3 md:h-4 md:w-4 text-cyan-600" />}
                          {selectedMode === 'home_visit' && <Home className="h-3 w-3 md:h-4 md:w-4 text-cyan-600" />}
                          {selectedMode === 'online' ? 'Online' : selectedMode === 'offline' ? 'Clinic' : 'Home'}
                        </span>
                      </div>
                      {/* Patient Details in Summary */}
                      {patientName && (
                        <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                          <span className="text-[12px] md:text-[13px] text-gray-500">Patient Name</span>
                          <span className="text-[13px] md:text-[14px] font-medium text-gray-900">{patientName}</span>
                        </div>
                      )}
                      {patientPhone && (
                        <div className="flex justify-between py-2 md:py-3 border-b border-gray-100">
                          <span className="text-[12px] md:text-[13px] text-gray-500">Mobile</span>
                          <span className="text-[13px] md:text-[14px] font-medium text-gray-900">+91 {patientPhone}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between py-3 md:py-4 bg-cyan-50 rounded-lg px-3 md:px-4 -mx-2 mt-3 md:mt-4">
                        <span className="text-[14px] md:text-[15px] font-semibold text-gray-900">Total</span>
                        <span className="text-[16px] md:text-[18px] font-bold text-cyan-600 flex items-center">
                          <IndianRupee className="h-3.5 w-3.5 md:h-4 md:w-4" />{calculatePrice()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 rounded-xl border border-gray-200 bg-white">
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-gray-900 mb-2">Patient Details</h3>
                    <p className="text-[12px] md:text-[13px] text-gray-500 mb-3 md:mb-4">Required for appointment confirmation</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-[13px] md:text-[14px]"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-[13px]">
                            +91
                          </span>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={patientPhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPatientPhone(value);
                              if (value.length === 10) {
                                setPhoneError(null);
                              } else if (value.length > 0) {
                                setPhoneError('Please enter a valid 10-digit mobile number');
                              }
                            }}
                            className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-[13px] md:text-[14px] ${phoneError ? 'border-red-300' : 'border-gray-200'}`}
                            required
                          />
                        </div>
                        {phoneError && (
                          <p className="text-red-500 text-[12px] mt-1">{phoneError}</p>
                        )}
                        <p className="text-gray-400 text-[11px] mt-1">We'll send appointment updates to this number</p>
                      </div>
                      
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1">
                          Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <Textarea
                          placeholder="Describe your symptoms or concerns..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="border-gray-200 focus:border-cyan-500 text-[13px] md:text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[14px] flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> {bookingError}
                  </div>
                )}

                <div className="flex justify-between mt-10">
                  <Button variant="outline" onClick={goToPrevStep} className="h-11 px-6 rounded-full" disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    onClick={handleBookingSubmit}
                    disabled={isSubmitting}
                    className="h-11 px-8 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <> Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Confetti ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" manualstart />
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageSuspenseSkeleton />}>
      <BookingPageContent />
    </Suspense>
  );
}
