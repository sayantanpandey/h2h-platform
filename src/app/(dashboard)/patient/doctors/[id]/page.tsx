'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';
import Link from 'next/link';
import { 
  Star, Video, Building2, Home, MapPin, 
  Calendar, Phone, Mail, Award, Stethoscope,
  User, MessageSquare, Users, Heart
} from 'lucide-react';

interface DoctorDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatarUrl?: string | null;
  specializations: string[];
  qualifications: string[];
  experienceYears: number;
  bio: string;
  onlineFee: number | null;
  clinicFee: number | null;
  rating: number;
  totalReviews: number;
  offersOnline: boolean;
  offersClinic: boolean;
  offersHomeVisit: boolean;
  memberSince?: string;
  totalPatients?: number;
  totalAppointments?: number;
  location: { id: string; name: string; city: string } | null;
  availableCities?: string[];
  consultationTypes?: Array<{ id: string; name: string; duration: number; onlinePrice: number; clinicPrice: number }>;
  services: Array<{ id: string; name: string; category: string; duration: number; price: number }>;
  weeklyAvailability: Array<{
    day: string;
    dayIndex: number;
    isAvailable: boolean;
    slots: Array<{ startTime: string; endTime: string; mode: string; centerName: string | null }>;
  }>;
  clinicCenters: Array<{ id: string; name: string; address: string; city: string; phone: string }>;
  reviews: Array<{ id: string; rating: number; comment: string; date: string; patientName: string }>;
}

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function DoctorDetailsPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patient/doctors/${doctorId}`);
      const data = await res.json();
      if (data.success) {
        setDoctor(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Sidebar Skeleton */}
          <div className="lg:col-span-3">
            <Card className="border rounded-xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Skeleton className="h-24 w-24 rounded-full mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-6 w-20 mb-4" />
                  <Skeleton className="h-10 w-full mb-6" />
                  <div className="w-full space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Doctor Not Found</h2>
          <p className="text-gray-500 mb-6">The doctor profile you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
            <Link href="/patient/doctors">Browse Doctors</Link>
          </Button>
        </div>
      </div>
    );
  }

  const memberDate = doctor.memberSince ? new Date(doctor.memberSince) : null;
  const memberFormatted = memberDate 
    ? memberDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Sidebar - Clean & Minimal */}
        <div className="lg:col-span-3">
          <Card className="border rounded-xl">
            <CardContent className="p-5">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-4">
                <DoctorAvatar
                  name={doctor.name}
                  email={doctor.email}
                  avatar={doctor.avatarUrl}
                  size="lg"
                  border
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{doctor.name}</h2>
                  <p className="text-sm text-gray-500 truncate">{doctor.specializations?.[0] || 'Specialist'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm mb-4">
                {doctor.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                )}
                {doctor.location?.city && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{doctor.location.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {memberFormatted}</span>
                </div>
              </div>

              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 mb-4" asChild>
                <Link href={`/booking?doctor=${doctor.id}`}>
                  Book Appointment
                </Link>
              </Button>

              {/* Consultation Fees by Duration */}
              {doctor.consultationTypes && doctor.consultationTypes.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation Fees</p>
                    {doctor.consultationTypes.map((slot) => (
                      <div key={slot.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{slot.name}</span>
                          <Badge variant="outline" className="text-xs">{slot.duration} min</Badge>
                        </div>
                        <div className="flex gap-2">
                          {doctor.offersOnline && slot.onlinePrice && (
                            <div className="flex-1 flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                              <span className="flex items-center gap-1 text-blue-700">
                                <Video className="h-3 w-3" /> Online
                              </span>
                              <span className="font-semibold text-blue-900">₹{slot.onlinePrice}</span>
                            </div>
                          )}
                          {doctor.offersClinic && slot.clinicPrice && (
                            <div className="flex-1 flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                              <span className="flex items-center gap-1 text-green-700">
                                <Building2 className="h-3 w-3" /> Clinic
                              </span>
                              <span className="font-semibold text-green-900">₹{slot.clinicPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator className="my-4" />

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2">
                  <p className="text-lg font-bold text-gray-900">{doctor.experienceYears}</p>
                  <p className="text-xs text-gray-500">Years Exp.</p>
                </div>
                <div className="p-2">
                  <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {doctor.rating?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{doctor.totalPatients || 0}</p>
                    <p className="text-sm text-gray-500">Patients Treated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{doctor.totalAppointments || 0}</p>
                    <p className="text-sm text-gray-500">Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{doctor.rating ? `${(doctor.rating * 20).toFixed(0)}%` : '0%'}</p>
                    <p className="text-sm text-gray-500">Satisfaction Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-white">
                About
              </TabsTrigger>
              <TabsTrigger value="availability" className="rounded-lg data-[state=active]:bg-white">
                Availability
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-white">
                Services
              </TabsTrigger>
              <TabsTrigger value="locations" className="rounded-lg data-[state=active]:bg-white">
                Locations
              </TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="mt-6">
              <Card className="border rounded-xl">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                  <CardDescription>Professional background and qualifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600 leading-relaxed">
                    {doctor.bio || `Dr. ${doctor.name} is a highly experienced ${doctor.specializations?.[0] || 'healthcare'} specialist with ${doctor.experienceYears} years of practice. Known for providing compassionate care and evidence-based treatment approaches.`}
                  </p>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Qualifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.qualifications?.length > 0 ? (
                        doctor.qualifications.map((q, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-50 px-3 py-1.5">
                            <Award className="h-3 w-3 mr-1.5 text-cyan-500" />
                            {q}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No qualifications listed</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specializations?.map((s, i) => (
                        <Badge key={i} className="bg-cyan-50 text-cyan-700 border-cyan-200 px-3 py-1.5">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {doctor.availableCities && doctor.availableCities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Available Cities</h4>
                      <div className="flex flex-wrap gap-2">
                        {doctor.availableCities.map((city, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-50 px-3 py-1.5">
                            <MapPin className="h-3 w-3 mr-1.5 text-gray-400" />
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card className="border rounded-xl mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Patient Reviews</CardTitle>
                      <CardDescription>What patients say about Dr. {doctor.name.split(' ').pop()}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{doctor.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-500">({doctor.totalReviews || 0})</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {doctor.reviews?.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doctor.reviews?.slice(0, 3).map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {review.patientName?.charAt(0) || 'P'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{review.patientName}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(review.date).toLocaleDateString('en-IN', { 
                                    day: 'numeric', month: 'short', year: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="mt-6">
              <Card className="border rounded-xl">
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Available time slots for appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctor.weeklyAvailability?.map((day) => (
                      <div
                        key={day.dayIndex}
                        className={`p-4 rounded-xl border transition-all ${
                          day.isAvailable 
                            ? 'bg-white border-gray-200' 
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <p className={`text-sm font-semibold mb-3 ${day.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                          {day.day}
                        </p>
                        {day.isAvailable ? (
                          <div className="space-y-2">
                            {day.slots.map((slot, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  {slot.mode === 'online' ? (
                                    <Video className="h-4 w-4 text-blue-500" />
                                  ) : slot.mode === 'offline' ? (
                                    <Building2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="flex -space-x-1">
                                      <Video className="h-3.5 w-3.5 text-blue-500" />
                                      <Building2 className="h-3.5 w-3.5 text-green-500" />
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-900">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </span>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  slot.mode === 'online' ? 'border-blue-200 text-blue-600 bg-blue-50' : 
                                  slot.mode === 'offline' ? 'border-green-200 text-green-600 bg-green-50' : 
                                  'border-purple-200 text-purple-600 bg-purple-50'
                                }`}>
                                  {slot.mode === 'online' ? 'Online' : 
                                   slot.mode === 'offline' ? 'Clinic' : 'Both'}
                                </Badge>
                              </div>
                            ))}
                            {day.slots.some(s => s.centerName) && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                {day.slots.filter(s => s.centerName).map((slot, i) => (
                                  <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {slot.centerName}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">Off</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-6">
              <Card className="border rounded-xl">
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                  <CardDescription>Medical services and treatments available</CardDescription>
                </CardHeader>
                <CardContent>
                  {doctor.services?.length === 0 ? (
                    <div className="text-center py-8">
                      <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No services listed</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {doctor.services?.map((service) => (
                        <Badge 
                          key={service.id} 
                          variant="outline" 
                          className="bg-gray-50 px-4 py-2 text-sm cursor-pointer hover:bg-cyan-50 hover:border-cyan-200 transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5 mr-2 text-cyan-500" />
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="mt-6">
              <Card className="border rounded-xl">
                <CardHeader>
                  <CardTitle>Clinic Locations</CardTitle>
                  <CardDescription>Where you can visit the doctor</CardDescription>
                </CardHeader>
                <CardContent>
                  {doctor.clinicCenters?.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No clinic locations listed</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {doctor.clinicCenters?.map((center) => (
                        <div key={center.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{center.name}</p>
                              <p className="text-sm text-gray-500 flex items-start gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{center.address ? `${center.address}, ` : ''}{center.city}</span>
                              </p>
                              {center.phone && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {center.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button className="w-full mt-3 bg-gray-900 hover:bg-gray-800" size="sm" asChild>
                            <Link href={`/booking?center=${center.id}&doctor=${doctor.id}`}>
                              Book at this location
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
