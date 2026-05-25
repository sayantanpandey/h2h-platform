'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DoctorCardsSkeleton } from '@/components/admin/AdminSkeletons';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Star, Video, Building2, Home, MapPin, 
  Briefcase, IndianRupee, Stethoscope, Filter
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  avatar: string;
  specializations: string[];
  qualifications: string[];
  experienceYears: number;
  bio: string;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  offersOnline: boolean;
  offersClinic: boolean;
  offersHomeVisit: boolean;
  location: { id: string; name: string; city: string } | null;
}

export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec, selectedCity]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSpec) params.append('specialization', selectedSpec);
      if (selectedCity) params.append('city', selectedCity);
      
      const res = await fetch(`/api/patient/doctors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data || []);
        setSpecializations(data.filters?.specializations || []);
        setCities(data.filters?.cities || []);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDoctors();
  };

  // Filter doctors by search locally for instant feedback
  const filteredDoctors = search 
    ? doctors.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specializations?.some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : doctors;

  return (
    <div className="p-3 md:p-6 lg:p-8 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">Find Doctors</h1>
          <p className="text-xs md:text-sm text-gray-500">Browse and book appointments with our doctors</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-10 bg-white"
          />
        </div>
        <select
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-md text-sm bg-white min-w-[150px]"
        >
          <option value="">All Specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-md text-sm bg-white min-w-[120px]"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-white border-gray-200 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="bg-white border-gray-200 rounded-xl">
          <CardContent className="py-16 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No doctors found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="bg-white border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <DoctorAvatar
                    name={doctor.name}
                    email={doctor.email}
                    avatar={doctor.avatarUrl}
                    size="lg"
                    border
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{doctor.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{doctor.specializations?.slice(0, 2).join(', ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px]">
                        <Star className="h-3 w-3 mr-0.5 fill-yellow-500" /> {doctor.rating?.toFixed(1) || 'N/A'}
                      </Badge>
                      <span className="text-[10px] text-gray-400">{doctor.totalReviews || 0} reviews</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-gray-400" /> {doctor.experienceYears} yrs
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3 text-gray-400" /> {doctor.consultationFee}
                  </span>
                  {doctor.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" /> {doctor.location.city}
                    </span>
                  )}
                </div>

                {/* Modes */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {doctor.offersOnline && (
                    <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px]">
                      <Video className="h-3 w-3 mr-0.5" /> Online
                    </Badge>
                  )}
                  {doctor.offersClinic && (
                    <Badge className="bg-green-50 text-green-600 border-0 text-[10px]">
                      <Building2 className="h-3 w-3 mr-0.5" /> Clinic
                    </Badge>
                  )}
                  {doctor.offersHomeVisit && (
                    <Badge className="bg-orange-50 text-orange-600 border-0 text-[10px]">
                      <Home className="h-3 w-3 mr-0.5" /> Home
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8" asChild>
                    <Link href={`/patient/doctors/${doctor.id}`}>View Profile</Link>
                  </Button>
                  <Button size="sm" className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs h-8" asChild>
                    <Link href={`/booking?doctor=${doctor.id}`}>Book Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
