'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  MapPin,
  Stethoscope,
  IndianRupee,
  TrendingUp,
  ArrowRight,
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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load dashboard');
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return <AdminContentSkeleton variant="dashboard" />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">{error || 'No data available'}</p>
        <Button onClick={fetchDashboard} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
      </div>
    );
  }

  const { stats, recentAppointments, locationStats } = data;

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: `${stats.todayAppointments} today`, icon: IndianRupee, color: 'bg-green-100 text-green-600' },
    { title: 'Total Appointments', value: stats.totalAppointments.toLocaleString(), sub: `${stats.todayAppointments} today`, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Doctors', value: stats.totalDoctors.toLocaleString(), sub: `${stats.totalServices} services`, icon: Stethoscope, color: 'bg-purple-100 text-purple-600' },
    { title: 'Total Patients', value: stats.totalPatients.toLocaleString(), sub: `${locationStats.length} locations`, icon: Users, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of H2H Healthcare Platform</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={fetchDashboard} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button asChild size="sm"><Link href="/super-admin">Super Admin</Link></Button>
        </div>
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
              <CardDescription>Latest bookings across all locations</CardDescription>
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
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{apt.patient}</p>
                        <Badge variant={
                          apt.status === 'completed' ? 'default' :
                          apt.status === 'confirmed' ? 'secondary' : 'outline'
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {apt.doctor} • {apt.service} • {apt.location}
                      </p>
                    </div>
                    <p className="font-semibold ml-2">₹{apt.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Location Performance</CardTitle>
              <CardDescription>Revenue and appointments by city</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/super-admin/locations">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {locationStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No locations configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locationStats.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium">{loc.city}</p>
                        <p className="text-sm text-muted-foreground">
                          {loc.doctors} doctors • {loc.appointments} appointments
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">₹{loc.revenue > 0 ? (loc.revenue >= 1000 ? `${(loc.revenue / 1000).toFixed(0)}K` : loc.revenue.toLocaleString()) : '0'}</p>
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
            <Button asChild><Link href="/super-admin/doctors"><Stethoscope className="mr-2 h-4 w-4" />Manage Doctors</Link></Button>
            <Button variant="outline" asChild><Link href="/super-admin/locations"><MapPin className="mr-2 h-4 w-4" />Manage Locations</Link></Button>
            <Button variant="outline" asChild><Link href="/super-admin/services"><TrendingUp className="mr-2 h-4 w-4" />Manage Services</Link></Button>
            <Button variant="outline" asChild><Link href="/super-admin/users"><Users className="mr-2 h-4 w-4" />Manage Users</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
