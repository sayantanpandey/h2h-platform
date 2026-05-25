'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  Users, 
  Calendar, 
  IndianRupee,
  MapPin,
  RefreshCw,
  ArrowRight,
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
    appointments: number;
    doctors: number;
    revenue: number;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return <AdminContentSkeleton variant="dashboard" />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">Failed to load dashboard</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">Retry</button>
      </div>
    );
  }

  const { stats, recentAppointments, locationStats } = data;

  const statCards = [
    { label: 'Active Services', value: stats.totalServices, icon: Stethoscope, color: 'bg-blue-500' },
    { label: 'Active Doctors', value: stats.totalDoctors, icon: Users, color: 'bg-green-500' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Today', value: stats.todayAppointments, icon: Calendar, color: 'bg-cyan-500' },
    { label: 'Patients', value: stats.totalPatients, icon: Users, color: 'bg-orange-500' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchDashboard} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 touch-manipulation">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{stat.label}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 truncate">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 sm:p-2.5 rounded-lg shrink-0`}>
                <stat.icon className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 min-w-0 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Appointments</h2>
            <Link href="/super-admin/appointments" className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium shrink-0">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 sm:p-5 overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No appointments yet</p>
              </div>
            ) : (
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 sm:pb-3 font-medium">Patient</th>
                    <th className="pb-2 sm:pb-3 font-medium">Doctor</th>
                    <th className="pb-2 sm:pb-3 font-medium hidden md:table-cell">Service</th>
                    <th className="pb-2 sm:pb-3 font-medium">Status</th>
                    <th className="pb-2 sm:pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.slice(0, 6).map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 sm:py-3 text-sm font-medium text-gray-900">{apt.patient}</td>
                      <td className="py-2.5 sm:py-3 text-sm text-gray-600">{apt.doctor}</td>
                      <td className="py-2.5 sm:py-3 text-sm text-gray-600 hidden md:table-cell">{apt.service}</td>
                      <td className="py-2.5 sm:py-3">
                        <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">₹{apt.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Location Performance */}
        <div className="bg-white rounded-xl border border-gray-200 min-w-0 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Location Performance</h2>
            <Link href="/super-admin/locations" className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium shrink-0">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            {locationStats.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No locations configured</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {locationStats.map((loc) => (
                  <div key={loc.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-cyan-100 rounded-lg shrink-0">
                        <MapPin className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{loc.city}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{loc.doctors} doctors • {loc.appointments} appointments</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base shrink-0">₹{loc.revenue > 0 ? (loc.revenue >= 1000 ? `${(loc.revenue / 1000).toFixed(0)}K` : loc.revenue.toLocaleString()) : '0'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
