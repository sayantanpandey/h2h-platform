'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { DailyJoinButton } from '@/components/video/DailyJoinButton';
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  ArrowRight,
  Users,
  FileText,
  Loader2,
  RefreshCw,
  Stethoscope,
  Phone,
  Mail,
  ExternalLink,
  XCircle,
} from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  amount: number;
  mode: string;
  patient: string;
  patientEmail?: string;
  patientPhone?: string;
  doctor: string;
  service: string;
  location: string;
  googleMeetLink?: string | null;
}

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  completedCount?: number;
  pendingCount?: number;
  cancelledCount?: number;
  totalPatients: number;
  totalServices: number;
  totalPrescriptions?: number;
  thisWeekAppointments?: number;
  lastWeekAppointments?: number;
  weekTrend?: number;
}

interface UpcomingApt {
  id: string;
  date: string;
  time: string;
  status: string;
  patient: string;
  service: string;
  location: string;
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingApt[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/dashboard');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
        setAppointments(json.data.recentAppointments || []);
        setUpcoming(json.data.upcomingAppointments || []);
      } else {
        setError(json.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div>
                    <Skeleton className="h-7 w-12 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const uniquePatients = [...new Set(appointments.map(a => a.patient))];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your appointments, patients, and activity
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="shrink-0 border-gray-200 text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Appointment breakdown — In, Out, Whole, Completed */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Appointment breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100">
                  <Calendar className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats?.totalAppointments ?? 0}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Total appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-800 tabular-nums">{stats?.completedCount ?? 0}</p>
                  <p className="text-xs font-medium text-emerald-700/80 mt-0.5">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-100">
                  <Calendar className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-800 tabular-nums">{stats?.pendingCount ?? 0}</p>
                  <p className="text-xs font-medium text-cyan-700/80 mt-0.5">Upcoming (in)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-800 tabular-nums">{stats?.todayAppointments ?? 0}</p>
                  <p className="text-xs font-medium text-amber-700/80 mt-0.5">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100">
                  <XCircle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-800 tabular-nums">{stats?.cancelledCount ?? 0}</p>
                  <p className="text-xs font-medium text-rose-700/80 mt-0.5">Cancelled / no-show</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats?.totalPatients ?? 0}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Unique patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary stats + Right sidebar content */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
        <div className="space-y-6">
          {/* Services & Prescriptions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{stats?.totalServices ?? 0}</p>
                  <p className="text-xs text-gray-500">Services offered</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{stats?.totalPrescriptions ?? 0}</p>
                  <p className="text-xs text-gray-500">Prescriptions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content: Recent Appointments */}
        {/* Recent Appointments */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">Recent appointments</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {completedToday} completed today · {todayAppointments.length} total today
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 text-[12px] h-8" asChild>
              <Link href="/doctor/appointments">
                View All
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-[13px]">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className={`p-2 rounded-lg ${apt.mode === 'online' ? 'bg-blue-50' : 'bg-green-50'}`}>
                      {apt.mode === 'online' ? (
                        <Video className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Building2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[13px] text-gray-900">{apt.patient}</p>
                          <p className="text-[12px] text-gray-500">{apt.service}</p>
                        </div>
                        <Badge className={`border-0 text-[10px] font-medium px-2 py-0.5 shrink-0 ${
                          apt.status === 'confirmed' ? 'bg-cyan-500 text-white' :
                          apt.status === 'completed' ? 'bg-emerald-500 text-white' :
                          apt.status === 'cancelled' || apt.status === 'no_show' ? 'bg-rose-100 text-rose-700' :
                          apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {apt.status === 'no_show' ? 'No show' : apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {apt.date ? new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {apt.patientPhone && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Phone className="h-3 w-3" />{apt.patientPhone}
                          </span>
                        )}
                        {apt.patientEmail && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 truncate max-w-[180px]">
                            <Mail className="h-3 w-3" />{apt.patientEmail}
                          </span>
                        )}
                      </div>
                      {apt.googleMeetLink && apt.status === 'confirmed' && apt.mode === 'online' && (
                        <div className="mt-2">
                          {apt.googleMeetLink.includes('daily.co') ? (
                            <DailyJoinButton
                              appointmentId={apt.id}
                              role="doctor"
                              variant="button"
                              label="Join Meet"
                              className="text-[11px] h-8 border-green-200 text-green-700 hover:bg-green-50"
                            />
                          ) : (
                            <a
                              href={apt.googleMeetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-[11px] font-medium text-green-700 hover:bg-green-100 transition-colors"
                            >
                              <Video className="h-3.5 w-3.5" />
                              Join Meet
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Right sidebar: Week trend, Upcoming, Recent Patients, Quick actions */}
        <div className="space-y-6 lg:min-w-[280px]">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm font-medium text-gray-600">This week vs last week</p>
              <p className={`text-2xl font-bold mt-2 tabular-nums ${(stats?.weekTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {(stats?.weekTrend ?? 0) >= 0 ? '+' : ''}{stats?.weekTrend ?? 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.thisWeekAppointments ?? 0} this week · {stats?.lastWeekAppointments ?? 0} last week
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Upcoming</CardTitle>
              <CardDescription className="text-xs text-gray-500">{upcoming.length} scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No upcoming appointments</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.slice(0, 4).map((apt) => (
                    <div key={apt.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.patient}</p>
                        <p className="text-xs text-gray-500">{apt.service} · {apt.location}</p>
                      </div>
                      <p className="text-xs font-medium text-gray-600">
                        {apt.date ? new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} {apt.time?.slice(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Recent patients</CardTitle>
                <CardDescription className="text-xs text-gray-500">{uniquePatients.length} unique patients seen</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {uniquePatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-[13px]">No patients yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uniquePatients.slice(0, 5).map((patientName, idx) => {
                    const latestApt = appointments.find(a => a.patient === patientName);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[13px] text-cyan-700">
                            {patientName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[13px] text-gray-900">{patientName}</p>
                            <p className="text-[11px] text-gray-500">{latestApt?.service || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Last Visit</p>
                          <p className="text-[12px] font-medium text-gray-700">
                            {latestApt?.date ? new Date(latestApt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Quick actions</CardTitle>
              <CardDescription className="text-xs text-gray-500">Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm h-9 justify-center w-full" asChild>
                  <Link href="/doctor/schedule">
                    <Calendar className="mr-2 h-4 w-4" />
                    Manage Schedule
                  </Link>
                </Button>
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 text-sm h-9 justify-center w-full" asChild>
                  <Link href="/doctor/prescriptions">
                    <FileText className="mr-2 h-4 w-4" />
                    Write Prescription
                  </Link>
                </Button>
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 text-sm h-9 justify-center w-full" asChild>
                  <Link href="/doctor/appointments">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Appointments
                  </Link>
                </Button>
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 text-sm h-9 justify-center w-full" asChild>
                  <Link href="/doctor/patients">
                    <Users className="mr-2 h-4 w-4" />
                    View Patients
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
