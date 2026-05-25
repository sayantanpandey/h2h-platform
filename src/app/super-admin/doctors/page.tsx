'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, Check, Loader2, 
  User, MapPin, Star, Clock, Phone, Mail, Stethoscope,
  GraduationCap, Calendar, Video, Building2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ProfilePhotoPicker } from '@/components/shared/ProfilePhotoPicker';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';
import { DoctorCardsSkeleton } from '@/components/admin/AdminSkeletons';

interface SlotType {
  id?: string;
  duration_minutes: number;
  online_price: number;
  offline_price: number;
  home_visit_price: number;
  home_visit_additional_charge: number;
  label: string;
  description?: string;
  is_active: boolean;
}

interface AvailabilitySlot {
  id?: string;
  start_time: string;
  end_time: string;
  mode: 'online' | 'offline' | 'both';
  center_id?: string; // Which clinic center for offline/both mode
}

interface DoctorAvailability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  mode: 'online' | 'offline' | 'both';
  break_start?: string;
  break_end?: string;
}

interface DayAvailability {
  day_of_week: number;
  is_available: boolean;
  slots: AvailabilitySlot[];
}

interface Doctor {
  id: string;
  user_id: string;
  location_id: string | null;
  specializations: string[];
  qualifications: string[];
  experience_years: number;
  bio: string | null;
  google_meet_enabled: boolean;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  };
  location: {
    id: string;
    name: string;
    city: string;
  } | null;
  services: { id: string; name: string; slug: string }[];
  availability: DoctorAvailability[];
  slot_types?: SlotType[];
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface ClinicCenter {
  id: string;
  location_id: string;
  name: string;
  slug: string;
  address: string;
  location?: Location;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SPECIALIZATIONS = [
  'Sports Physiotherapy',
  'Orthopedic Rehabilitation',
  'Pain Management',
  'Neurological Physiotherapy',
  'Pediatric Physiotherapy',
  'Geriatric Care',
  'Post-Surgical Rehabilitation',
  'Yoga Therapy',
  'Manual Therapy',
  'Cardiopulmonary Physiotherapy',
];

const QUALIFICATIONS = [
  'BPT (Bachelor of Physiotherapy)',
  'MPT (Master of Physiotherapy)',
  'PhD in Physiotherapy',
  'DPT (Doctor of Physical Therapy)',
  'Certified Manual Therapist',
  'Sports Medicine Certification',
  'Dry Needling Certification',
  'Yoga Instructor Certification',
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clinicCenters, setClinicCenters] = useState<ClinicCenter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Default slot types with separate online/offline/home_visit pricing
  const DEFAULT_SLOT_TYPES: SlotType[] = [
    { duration_minutes: 15, online_price: 400, offline_price: 500, home_visit_price: 800, home_visit_additional_charge: 300, label: 'Quick Consultation', is_active: true },
    { duration_minutes: 30, online_price: 800, offline_price: 1000, home_visit_price: 1500, home_visit_additional_charge: 500, label: 'Standard Session', is_active: true },
    { duration_minutes: 45, online_price: 1200, offline_price: 1500, home_visit_price: 2200, home_visit_additional_charge: 700, label: 'Extended Session', is_active: true },
    { duration_minutes: 60, online_price: 1600, offline_price: 2000, home_visit_price: 3000, home_visit_additional_charge: 1000, label: 'Comprehensive Session', is_active: false },
  ];

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    avatar_url: '',
    location_id: '',
    specializations: [] as string[],
    qualifications: [] as string[],
    experience_years: 0,
    bio: '',
    consultation_fee: 1000,
    rating: 5.0,
    total_reviews: 0,
    google_meet_enabled: true,
    is_active: true,
    // Consultation modes the doctor offers
    offers_online: true,
    offers_clinic: true,
    offers_home_visit: false,
    home_visit_radius_km: 10,
    services: [] as string[],
    // Legacy availability format (for backward compatibility)
    availability: DAYS_OF_WEEK.map((_, index) => ({
      day_of_week: index,
      start_time: '09:00',
      end_time: '18:00',
      is_available: index !== 0, // Sunday off
      mode: 'both' as 'online' | 'offline' | 'both',
      break_start: '',
      break_end: '',
    })),
    // New multi-slot availability format
    day_availability: DAYS_OF_WEEK.map((_, index) => ({
      day_of_week: index,
      is_available: index !== 0, // Sunday off
      slots: [
        { start_time: '09:00', end_time: '18:00', mode: 'both' as 'online' | 'offline' | 'both' }
      ] as AvailabilitySlot[],
    })) as DayAvailability[],
    slot_types: DEFAULT_SLOT_TYPES,
  });

  // Custom input states
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [customQualification, setCustomQualification] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchLocations();
    fetchClinicCenters();
    fetchServices();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors');
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (data.success) {
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchClinicCenters = async () => {
    try {
      const res = await fetch('/api/clinic-centers');
      const data = await res.json();
      if (data.success) {
        setClinicCenters(data.data.centers || []);
      }
    } catch (err) {
      console.error('Failed to fetch clinic centers:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const openCreateModal = () => {
    setEditingDoctor(null);
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      avatar_url: '',
      location_id: '',
      specializations: [],
      qualifications: [],
      experience_years: 0,
      bio: '',
      consultation_fee: 1000,
      rating: 5.0,
      total_reviews: 0,
      google_meet_enabled: true,
      is_active: true,
      offers_online: true,
      offers_clinic: true,
      offers_home_visit: false,
      home_visit_radius_km: 10,
      services: [],
      availability: DAYS_OF_WEEK.map((_, index) => ({
        day_of_week: index,
        start_time: '09:00',
        end_time: '18:00',
        is_available: index !== 0,
        mode: 'both' as 'online' | 'offline' | 'both',
        break_start: '',
        break_end: '',
      })),
      day_availability: DAYS_OF_WEEK.map((_, index) => ({
        day_of_week: index,
        is_available: index !== 0,
        slots: [{ start_time: '09:00', end_time: '18:00', mode: 'both' as 'online' | 'offline' | 'both' }],
      })),
      slot_types: DEFAULT_SLOT_TYPES,
    });
    setCustomSpecialization('');
    setCustomQualification('');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    // Convert legacy availability to day_availability format
    const dayAvailability = DAYS_OF_WEEK.map((_, index) => {
      const existingAvail = doctor.availability?.filter(a => a.day_of_week === index) || [];
      if (existingAvail.length > 0) {
        return {
          day_of_week: index,
          is_available: existingAvail.some(a => a.is_available),
          slots: existingAvail.map(a => ({
            start_time: a.start_time,
            end_time: a.end_time,
            mode: a.mode || 'both' as 'online' | 'offline' | 'both',
            center_id: (a as any).center_id || undefined,
          })),
        };
      }
      return {
        day_of_week: index,
        is_available: index !== 0,
        slots: [{ start_time: '09:00', end_time: '18:00', mode: 'both' as 'online' | 'offline' | 'both', center_id: undefined }],
      };
    });

    setFormData({
      email: doctor.user.email,
      full_name: doctor.user.full_name,
      phone: doctor.user.phone || '',
      avatar_url: doctor.user.avatar_url || '',
      location_id: doctor.location_id || '',
      specializations: doctor.specializations || [],
      qualifications: doctor.qualifications || [],
      experience_years: doctor.experience_years || 0,
      bio: doctor.bio || '',
      consultation_fee: doctor.consultation_fee || 1000,
      rating: doctor.rating || 5.0,
      total_reviews: doctor.total_reviews || 0,
      google_meet_enabled: doctor.google_meet_enabled,
      is_active: doctor.is_active,
      offers_online: (doctor as any).offers_online ?? true,
      offers_clinic: (doctor as any).offers_clinic ?? true,
      offers_home_visit: (doctor as any).offers_home_visit ?? false,
      home_visit_radius_km: (doctor as any).home_visit_radius_km ?? 10,
      services: doctor.services?.map(s => s.id) || [],
      availability: doctor.availability?.length > 0 
        ? doctor.availability.map(a => ({
            ...a,
            mode: a.mode || 'both' as 'online' | 'offline' | 'both',
            break_start: a.break_start || '',
            break_end: a.break_end || '',
          }))
        : DAYS_OF_WEEK.map((_, index) => ({
            day_of_week: index,
            start_time: '09:00',
            end_time: '18:00',
            is_available: index !== 0,
            mode: 'both' as 'online' | 'offline' | 'both',
            break_start: '',
            break_end: '',
          })),
      day_availability: dayAvailability,
      slot_types: doctor.slot_types || DEFAULT_SLOT_TYPES,
    });
    setCustomSpecialization('');
    setCustomQualification('');
    setError(null);
    setShowModal(true);
  };

  const addCustomSpecialization = () => {
    if (customSpecialization.trim() && !formData.specializations.includes(customSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, customSpecialization.trim()],
      }));
      setCustomSpecialization('');
    }
  };

  const addCustomQualification = () => {
    if (customQualification.trim() && !formData.qualifications.includes(customQualification.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, customQualification.trim()],
      }));
      setCustomQualification('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec),
    }));
  };

  const removeQualification = (qual: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qual),
    }));
  };

  // Validate time slots don't overlap within the same day
  const validateTimeSlots = (): string | null => {
    for (const dayAvail of formData.day_availability) {
      if (!dayAvail.is_available || dayAvail.slots.length < 2) continue;
      
      // Sort slots by start time
      const sortedSlots = [...dayAvail.slots].sort((a, b) => 
        a.start_time.localeCompare(b.start_time)
      );
      
      // Check for overlaps
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];
        
        // If current end time is after next start time, they overlap
        if (current.end_time > next.start_time) {
          const dayName = DAYS_OF_WEEK[dayAvail.day_of_week];
          return `Time slots overlap on ${dayName}: ${current.start_time}-${current.end_time} and ${next.start_time}-${next.end_time}`;
        }
      }
      
      // Validate each slot has valid times
      for (const slot of dayAvail.slots) {
        if (slot.start_time >= slot.end_time) {
          const dayName = DAYS_OF_WEEK[dayAvail.day_of_week];
          return `Invalid time range on ${dayName}: Start time (${slot.start_time}) must be before end time (${slot.end_time})`;
        }
      }
    }
    return null;
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Validate required fields
    if (!formData.full_name?.trim()) {
      setError('Full name is required');
      setSaving(false);
      return;
    }
    if (!formData.email?.trim()) {
      setError('Email is required');
      setSaving(false);
      return;
    }
    if (!formData.location_id) {
      setError('Please select a location');
      setSaving(false);
      return;
    }
    if (formData.services.length === 0) {
      setError('Please select at least one service');
      setSaving(false);
      return;
    }
    if (!formData.offers_online && !formData.offers_clinic && !formData.offers_home_visit) {
      setError('Please select at least one consultation mode (Online, Clinic, or Home Visit)');
      setSaving(false);
      return;
    }

    // Validate time slots before saving
    const validationError = validateTimeSlots();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      const url = '/api/admin/doctors';
      const method = editingDoctor ? 'PUT' : 'POST';
      const body = editingDoctor 
        ? { id: editingDoctor.id, ...formData }
        : formData;

      console.log('Saving doctor:', method, body);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log('Save response:', data);

      if (!res.ok) {
        throw new Error(data.error || `Failed to save doctor (${res.status})`);
      }

      setSuccessMessage(
        editingDoctor
          ? 'Doctor updated successfully!'
          : data.message || 'Doctor created successfully!'
      );
      await fetchDoctors();
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        setShowModal(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/doctors?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete doctor');
      }

      await fetchDoctors();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const toggleQualification = (qual: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.includes(qual)
        ? prev.qualifications.filter(q => q !== qual)
        : [...prev.qualifications, qual],
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const updateAvailability = (dayIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) => 
        i === dayIndex ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Doctor Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage doctors, services, and availability</p>
        </div>
        <Button onClick={openCreateModal} className="bg-cyan-500 hover:bg-cyan-600 text-white shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Doctor
        </Button>
      </div>

      {/* Search — full width on mobile */}
      <div className="relative w-full max-w-md sm:max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search by name, email, or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full min-h-10"
        />
      </div>

      {/* Doctors Grid — 1 col mobile, 2 tablet, 3 desktop */}
      {loading ? (
        <DoctorCardsSkeleton count={3} />
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white rounded-xl border border-gray-200 px-4">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by adding your first doctor</p>
          <Button onClick={openCreateModal} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Doctor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-shadow min-w-0">
              {/* Header */}
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <DoctorAvatar
                  name={doctor.user.full_name}
                  email={doctor.user.email}
                  avatar={doctor.user.avatar_url}
                  size="lg"
                  border
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{doctor.user.full_name}</h3>
                    <Badge className={`shrink-0 text-[10px] sm:text-xs ${doctor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {doctor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{doctor.user.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{doctor.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400">({doctor.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
                  <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 shrink-0" />
                  <span className="truncate">{doctor.specializations?.slice(0, 2).join(', ') || 'No specializations'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 shrink-0" />
                  <span>{doctor.experience_years || 0} years experience</span>
                </div>
                {doctor.location && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 shrink-0" />
                    <span>{doctor.location.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-cyan-600">₹{doctor.consultation_fee}</span>
                  <span className="text-gray-400">/ consultation</span>
                </div>
              </div>

              {/* Services */}
              {doctor.services && doctor.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                  {doctor.services.slice(0, 3).map(service => (
                    <Badge key={service.id} variant="outline" className="text-[10px] sm:text-xs">
                      {service.name}
                    </Badge>
                  ))}
                  {doctor.services.length > 3 && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs">+{doctor.services.length - 3}</Badge>
                  )}
                </div>
              )}

              {/* Actions — wrap on very small screens */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(doctor)}
                  className="flex-1"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                {deleteConfirm === doctor.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(doctor.id)}
                      className="flex-1"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(doctor.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — responsive padding and scroll */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="text-green-700 font-medium">{successMessage}</p>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">Error</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-500" /> Basic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Dr. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="doctor@example.com"
                      disabled={!!editingDoctor}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ProfilePhotoPicker
                      value={formData.avatar_url}
                      onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                      name={formData.full_name || 'Doctor'}
                      email={formData.email}
                      userId={editingDoctor?.user.id}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-500" /> Professional Details
                </h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5) ⭐</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Reviews</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.total_reviews}
                      onChange={(e) => setFormData({ ...formData, total_reviews: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief description about the doctor..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-cyan-500" /> Specializations *
                </h3>
                
                {/* Selected specializations */}
                {formData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    {formData.specializations.map(spec => (
                      <span key={spec} className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white rounded-full text-sm font-medium">
                        {spec}
                        <button type="button" onClick={() => removeSpecialization(spec)} className="hover:bg-cyan-600 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add custom specialization */}
                <div className="flex gap-2 mb-3">
                  <Input
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    placeholder="Add custom specialization..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecialization())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addCustomSpecialization}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Quick select from presets */}
                <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.filter(s => !formData.specializations.includes(s)).map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Qualifications</h3>
                
                {/* Selected qualifications */}
                {formData.qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    {formData.qualifications.map(qual => (
                      <span key={qual} className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-full text-sm font-medium">
                        {qual}
                        <button type="button" onClick={() => removeQualification(qual)} className="hover:bg-teal-600 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add custom qualification */}
                <div className="flex gap-2 mb-3">
                  <Input
                    value={customQualification}
                    onChange={(e) => setCustomQualification(e.target.value)}
                    placeholder="Add custom qualification (e.g., MBBS, MD, Fellowship)..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQualification())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addCustomQualification}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Quick select from presets */}
                <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {QUALIFICATIONS.filter(q => !formData.qualifications.includes(q)).map(qual => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => toggleQualification(qual)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      + {qual}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Availability Zone */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-500" /> Location & Availability Zone
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Clinic Location *</label>
                    <select
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="">Select a location</option>
                      {clinicCenters.length > 0 ? (
                        clinicCenters.map(center => (
                          <option key={center.id} value={center.location_id}>
                            {center.location?.city || 'Unknown'} - {center.name}
                          </option>
                        ))
                      ) : (
                        locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.city} - {loc.name}</option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select the clinic center where this doctor will be available</p>
                  </div>
                  
                  {formData.offers_home_visit && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Home Visit Service Area
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Service Radius (km)</label>
                          <Input
                            type="number"
                            value={formData.home_visit_radius_km}
                            onChange={(e) => setFormData({ ...formData, home_visit_radius_km: parseInt(e.target.value) || 10 })}
                            className="w-full"
                            min={1}
                            max={100}
                          />
                          <p className="text-xs text-gray-500 mt-1">Maximum distance for home visits</p>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{formData.home_visit_radius_km} km</div>
                            <div className="text-xs text-gray-500">coverage area</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Modes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-cyan-500" /> Consultation Modes
                </h3>
                <p className="text-sm text-gray-500 mb-4">Select the consultation types this doctor offers</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.offers_online ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.offers_online}
                      onChange={(e) => setFormData({ ...formData, offers_online: e.target.checked })}
                      className="h-5 w-5 text-green-500 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Online</span>
                      </div>
                      <span className="text-xs text-gray-500">Video consultations</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.offers_clinic ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.offers_clinic}
                      onChange={(e) => setFormData({ ...formData, offers_clinic: e.target.checked })}
                      className="h-5 w-5 text-blue-500 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">Clinic Visit</span>
                      </div>
                      <span className="text-xs text-gray-500">In-person at clinic</span>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.offers_home_visit ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.offers_home_visit}
                      onChange={(e) => setFormData({ ...formData, offers_home_visit: e.target.checked })}
                      className="h-5 w-5 text-orange-500 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-900">Home Visit</span>
                      </div>
                      <span className="text-xs text-gray-500">Visit patient's home</span>
                    </div>
                  </label>
                </div>
                {formData.offers_home_visit && (
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm text-gray-600">Home visit radius:</label>
                    <Input
                      type="number"
                      value={formData.home_visit_radius_km}
                      onChange={(e) => setFormData({ ...formData, home_visit_radius_km: parseInt(e.target.value) || 10 })}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">km</span>
                  </div>
                )}
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-500" /> Services Offered
                </h3>
                <p className="text-sm text-gray-500 mb-4">Select the services this doctor provides. Services are grouped by category.</p>
                {services.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Stethoscope className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No services found. Create services in the <span className="font-medium text-cyan-600">Services</span> page first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      services.reduce((groups, service) => {
                        const cat = service.category || 'uncategorized';
                        if (!groups[cat]) groups[cat] = [];
                        groups[cat].push(service);
                        return groups;
                      }, {} as Record<string, Service[]>)
                    ).map(([category, categoryServices]) => {
                      const CATEGORY_NAMES: Record<string, string> = {
                        pain_relief_physiotherapy: 'Pain Relief & Physiotherapy Care',
                        advanced_rehabilitation: 'Advanced Rehabilitation & Recovery',
                        nutrition_lifestyle: 'Nutrition & Lifestyle Care',
                        mental_wellness: 'Mental Wellness & Performance Care',
                        therapeutic_yoga: 'Therapeutic Yoga & Wellness',
                        sports_performance: 'Sports Performance & Athlete Development',
                        digital_health: 'Digital Health & Web Solutions',
                      };
                      const allSelected = categoryServices.every(s => formData.services.includes(s.id));
                      const someSelected = categoryServices.some(s => formData.services.includes(s.id));
                      return (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => {
                                const ids = categoryServices.map(s => s.id);
                                if (allSelected) {
                                  setFormData(prev => ({ ...prev, services: prev.services.filter(id => !ids.includes(id)) }));
                                } else {
                                  setFormData(prev => ({ ...prev, services: [...new Set([...prev.services, ...ids])] }));
                                }
                              }}
                              className="h-4 w-4 text-cyan-500 rounded"
                            />
                            <span className="text-sm font-semibold text-gray-800">{CATEGORY_NAMES[category] || category}</span>
                            <span className="text-xs text-gray-400 ml-auto">{categoryServices.filter(s => formData.services.includes(s.id)).length}/{categoryServices.length}</span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 p-3">
                            {categoryServices.map(service => (
                              <label
                                key={service.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                  formData.services.includes(service.id)
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.services.includes(service.id)}
                                  onChange={() => toggleService(service.id)}
                                  className="h-4 w-4 text-cyan-500 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">{service.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consultation Slot Types */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-500" /> Consultation Slot Types & Pricing
                </h3>
                <p className="text-sm text-gray-500 mb-4">Configure available consultation durations and their prices</p>
                <div className="space-y-3">
                  {formData.slot_types.map((slotType, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${slotType.is_active ? 'border-cyan-200 bg-cyan-50/30' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={slotType.is_active}
                              onChange={(e) => {
                                const newSlotTypes = [...formData.slot_types];
                                newSlotTypes[index] = { ...slotType, is_active: e.target.checked };
                                setFormData({ ...formData, slot_types: newSlotTypes });
                              }}
                              className="h-4 w-4 text-cyan-500 rounded"
                            />
                            <span className="text-sm font-bold text-gray-900">{slotType.duration_minutes} min</span>
                          </label>
                          <Input
                            placeholder="Label"
                            value={slotType.label}
                            onChange={(e) => {
                              const newSlotTypes = [...formData.slot_types];
                              newSlotTypes[index] = { ...slotType, label: e.target.value };
                              setFormData({ ...formData, slot_types: newSlotTypes });
                            }}
                            disabled={!slotType.is_active}
                            className="w-44"
                          />
                        </div>
                        {slotType.is_active && (
                          <div className="flex flex-wrap gap-3 pl-6">
                            {formData.offers_online && (
                              <div>
                                <label className="text-xs text-gray-500 flex items-center gap-1"><Video className="h-3 w-3 text-green-500" /> Online</label>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-gray-400 text-sm">₹</span>
                                  <Input
                                    type="number"
                                    value={slotType.online_price}
                                    onChange={(e) => {
                                      const newSlotTypes = [...formData.slot_types];
                                      newSlotTypes[index] = { ...slotType, online_price: parseFloat(e.target.value) || 0 };
                                      setFormData({ ...formData, slot_types: newSlotTypes });
                                    }}
                                    className="w-20 h-8 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                            {formData.offers_clinic && (
                              <div>
                                <label className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="h-3 w-3 text-blue-500" /> Clinic</label>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-gray-400 text-sm">₹</span>
                                  <Input
                                  type="number"
                                  value={slotType.offline_price}
                                  onChange={(e) => {
                                    const newSlotTypes = [...formData.slot_types];
                                    newSlotTypes[index] = { ...slotType, offline_price: parseFloat(e.target.value) || 0 };
                                    setFormData({ ...formData, slot_types: newSlotTypes });
                                  }}
                                  className="w-20 h-8 text-sm"
                                />
                              </div>
                            </div>
                            )}
                            {formData.offers_home_visit && (
                              <>
                                <div>
                                  <label className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3 text-orange-500" /> Home Visit</label>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-gray-400 text-sm">₹</span>
                                    <Input
                                      type="number"
                                      value={slotType.home_visit_price}
                                      onChange={(e) => {
                                        const newSlotTypes = [...formData.slot_types];
                                        newSlotTypes[index] = { ...slotType, home_visit_price: parseFloat(e.target.value) || 0 };
                                        setFormData({ ...formData, slot_types: newSlotTypes });
                                      }}
                                      className="w-20 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">+ Extra Charge</label>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-gray-400 text-sm">₹</span>
                                    <Input
                                      type="number"
                                      value={slotType.home_visit_additional_charge}
                                      onChange={(e) => {
                                        const newSlotTypes = [...formData.slot_types];
                                        newSlotTypes[index] = { ...slotType, home_visit_additional_charge: parseFloat(e.target.value) || 0 };
                                        setFormData({ ...formData, slot_types: newSlotTypes });
                                      }}
                                      className="w-20 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-500" /> Weekly Availability
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Set working hours for each day. Add multiple time slots with different modes (e.g., Clinic 8-12, Online 13-17).
                  {!formData.google_meet_enabled && <span className="text-orange-500 ml-2">⚠️ Enable Google Meet to schedule online consultations</span>}
                </p>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const dayAvail = formData.day_availability[dayIndex];
                    return (
                      <div key={day} className={`p-4 rounded-lg border ${dayAvail?.is_available ? 'border-cyan-200 bg-cyan-50/30' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dayAvail?.is_available ?? false}
                              onChange={(e) => {
                                // Determine default mode based on what doctor offers
                                let defaultMode: 'online' | 'offline' | 'both' = 'both';
                                if (formData.offers_online && formData.offers_clinic) {
                                  defaultMode = 'both';
                                } else if (formData.offers_online) {
                                  defaultMode = 'online';
                                } else if (formData.offers_clinic) {
                                  defaultMode = 'offline';
                                }
                                
                                const newDayAvail = [...formData.day_availability];
                                newDayAvail[dayIndex] = { 
                                  day_of_week: dayIndex,
                                  is_available: e.target.checked,
                                  slots: dayAvail?.slots || [{ start_time: '09:00', end_time: '18:00', mode: defaultMode }]
                                };
                                setFormData({ ...formData, day_availability: newDayAvail });
                              }}
                              className="h-4 w-4 text-cyan-500 rounded cursor-pointer"
                            />
                            <span className="text-sm font-bold text-gray-900">{day}</span>
                          </label>
                          {dayAvail?.is_available && (
                            <button
                              type="button"
                              onClick={() => {
                                // Determine default mode based on what doctor offers
                                let defaultMode: 'online' | 'offline' | 'both' = 'both';
                                if (formData.offers_online && formData.offers_clinic) {
                                  defaultMode = 'both';
                                } else if (formData.offers_online) {
                                  defaultMode = 'online';
                                } else if (formData.offers_clinic) {
                                  defaultMode = 'offline';
                                }
                                
                                const newDayAvail = [...formData.day_availability];
                                newDayAvail[dayIndex] = {
                                  ...dayAvail,
                                  slots: [...dayAvail.slots, { start_time: '09:00', end_time: '18:00', mode: defaultMode }]
                                };
                                setFormData({ ...formData, day_availability: newDayAvail });
                              }}
                              className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Add Time Slot
                            </button>
                          )}
                        </div>
                        
                        {dayAvail?.is_available && (
                          <div className="space-y-2 pl-6">
                            {dayAvail.slots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex flex-wrap items-center gap-3 p-2 bg-white rounded border border-gray-100">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={slot.start_time}
                                    onChange={(e) => {
                                      const newDayAvail = [...formData.day_availability];
                                      const newSlots = [...dayAvail.slots];
                                      newSlots[slotIndex] = { ...slot, start_time: e.target.value };
                                      newDayAvail[dayIndex] = { ...dayAvail, slots: newSlots };
                                      setFormData({ ...formData, day_availability: newDayAvail });
                                    }}
                                    className="w-24 h-8 text-sm"
                                  />
                                  <span className="text-gray-400 text-sm">to</span>
                                  <Input
                                    type="time"
                                    value={slot.end_time}
                                    onChange={(e) => {
                                      const newDayAvail = [...formData.day_availability];
                                      const newSlots = [...dayAvail.slots];
                                      newSlots[slotIndex] = { ...slot, end_time: e.target.value };
                                      newDayAvail[dayIndex] = { ...dayAvail, slots: newSlots };
                                      setFormData({ ...formData, day_availability: newDayAvail });
                                    }}
                                    className="w-24 h-8 text-sm"
                                  />
                                </div>
                                <select
                                  value={slot.mode}
                                  onChange={(e) => {
                                    const newDayAvail = [...formData.day_availability];
                                    const newSlots = [...dayAvail.slots];
                                    newSlots[slotIndex] = { ...slot, mode: e.target.value as 'online' | 'offline' | 'both' };
                                    newDayAvail[dayIndex] = { ...dayAvail, slots: newSlots };
                                    setFormData({ ...formData, day_availability: newDayAvail });
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm h-8"
                                >
                                  {/* Only show "Both" if doctor offers both online and clinic */}
                                  {formData.offers_online && formData.offers_clinic && (
                                    <option value="both">Both</option>
                                  )}
                                  {/* Only show "Online" if doctor offers online */}
                                  {formData.offers_online && (
                                    <option value="online">Online</option>
                                  )}
                                  {/* Only show "Clinic" if doctor offers clinic */}
                                  {formData.offers_clinic && (
                                    <option value="offline">Clinic</option>
                                  )}
                                </select>
                                {/* Center/Chamber selection for offline/both modes */}
                                {(slot.mode === 'offline' || slot.mode === 'both') && (
                                  <select
                                    value={slot.center_id || ''}
                                    onChange={(e) => {
                                      const newDayAvail = [...formData.day_availability];
                                      const newSlots = [...dayAvail.slots];
                                      newSlots[slotIndex] = { ...slot, center_id: e.target.value || undefined };
                                      newDayAvail[dayIndex] = { ...dayAvail, slots: newSlots };
                                      setFormData({ ...formData, day_availability: newDayAvail });
                                    }}
                                    className="px-2 py-1 border border-cyan-300 bg-cyan-50 rounded text-sm h-8 min-w-[150px]"
                                  >
                                    <option value="">📍 Center</option>
                                    {clinicCenters.length > 0 ? (
                                      clinicCenters.map((center) => (
                                        <option key={center.id} value={center.id}>
                                          {center.name}
                                        </option>
                                      ))
                                    ) : (
                                      <option value="" disabled>Loading centers...</option>
                                    )}
                                  </select>
                                )}
                                <div className="flex items-center gap-1">
                                  {slot.mode === 'online' && <Video className="h-4 w-4 text-green-500" />}
                                  {slot.mode === 'offline' && <Building2 className="h-4 w-4 text-blue-500" />}
                                  {slot.mode === 'both' && (
                                    <>
                                      <Video className="h-3 w-3 text-green-500" />
                                      <Building2 className="h-3 w-3 text-blue-500" />
                                    </>
                                  )}
                                </div>
                                {dayAvail.slots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDayAvail = [...formData.day_availability];
                                      const newSlots = dayAvail.slots.filter((_, i) => i !== slotIndex);
                                      newDayAvail[dayIndex] = { ...dayAvail, slots: newSlots };
                                      setFormData({ ...formData, day_availability: newDayAvail });
                                    }}
                                    className="text-red-400 hover:text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-cyan-500" /> Settings
                </h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.google_meet_enabled}
                      onChange={(e) => setFormData({ ...formData, google_meet_enabled: e.target.checked })}
                      className="h-4 w-4 text-cyan-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable Google Meet for online consultations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-cyan-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Active (visible to patients)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer - Cancel left, Save right */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-cyan-500 hover:bg-cyan-600 text-white ml-auto">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
