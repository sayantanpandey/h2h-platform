'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Stethoscope,
  IndianRupee,
  ArrowRight,
  Clock,
  Video,
  Building2,
  RefreshCw
} from 'lucide-react';
import { AdminContentSkeleton } from '@/components/admin/AdminSkeletons';

interface DashboardData {
  stats: {
    totalServices: number;
    totalDoctors: number;
    totalAppointments: number;
    todayAppointments: number;
    totalPatients: number;
    totalRevenue: number;
  };
  recentAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    amount: number;
    mode: string;
    patient: string;
    doctor: string;
    service: string;
    location: string;
  }[];
  locationStats: {
    id: string;
    city: string;
    name: string;
    appointments: number;
    doctors: number;
    revenue: number;
  }[];
}

interface Doctor {
  id: string;
  is_active: boolean;
  user: { full_name: string; avatar_url: string | null };
  specializations: string[];
}

export default function LocationAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, docRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/doctors'),
      ]);
      const dashJson = await dashRes.json();
      const docJson = await docRes.json();

      if (dashJson.success) setData(dashJson.data);
      else setError(dashJson.error || 'Failed to load dashboard');

      if (docJson.success) setDoctors(docJson.data || []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return <AdminContentSkeleton variant="dashboard" />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">{error || 'No data available'}</p>
        <Button onClick={fetchAll} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
      </div>
    );
  }

  const { stats, recentAppointments } = data;

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = recentAppointments.filter(a => a.date === today);

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalAppointments} total bookings`, icon: IndianRupee, color: 'bg-green-100 text-green-600' },
    { title: "Today's Appointments", value: stats.todayAppointments.toString(), sub: `${todayAppointments.filter(a => a.status === 'completed').length} completed`, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Doctors', value: doctors.filter(d => d.is_active).length.toString(), sub: `${doctors.length} total`, icon: Stethoscope, color: 'bg-purple-100 text-purple-600' },
    { title: 'Total Patients', value: stats.totalPatients.toLocaleString(), sub: `${stats.totalServices} services`, icon: Users, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your location&apos;s operations</p>
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Latest bookings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/super-admin/appointments">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-lg ${apt.mode === 'online' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {apt.mode === 'online' ? (
                        <Video className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Building2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{apt.patient}</p>
                        <Badge variant={
                          apt.status === 'completed' ? 'default' :
                          apt.status === 'confirmed' ? 'secondary' : 'outline'
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {apt.doctor} • {apt.service}
                      </p>
                      {apt.time && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />{apt.time} • {apt.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Doctors</CardTitle>
              <CardDescription>{doctors.length} doctors registered</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/super-admin/doctors">Manage <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Stethoscope className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No doctors added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.slice(0, 5).map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <img
                        src={doctor.user?.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${doctor.user?.full_name}&backgroundColor=b6e3f4`}
                        alt={doctor.user?.full_name}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <div>
                        <p className="font-medium">{doctor.user?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {doctor.specializations?.slice(0, 2).join(', ') || 'No specialization'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={doctor.is_active ? 'default' : 'outline'}>
                      {doctor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/super-admin/appointments"><Calendar className="mr-2 h-4 w-4" />View Appointments</Link></Button>
            <Button variant="outline" asChild><Link href="/super-admin/doctors"><Stethoscope className="mr-2 h-4 w-4" />Manage Doctors</Link></Button>
            <Button variant="outline" asChild><Link href="/super-admin/services"><Users className="mr-2 h-4 w-4" />Manage Services</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
