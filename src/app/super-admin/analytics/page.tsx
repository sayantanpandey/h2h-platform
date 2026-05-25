'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  BarChart3,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  IndianRupee,
  Stethoscope,
  Video,
  Target,
  UserPlus,
  Repeat,
  Percent,
} from 'lucide-react';
import { AnalyticsPageSkeleton } from '@/components/admin/AdminSkeletons';

const COLORS = ['#06b6d4', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'];

interface AnalyticsData {
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    completedCount: number;
    onlineCount: number;
    days: number;
    totalPatients?: number;
    newPatients?: number;
    activePatientsInPeriod?: number;
    repeatPatients?: number;
    bookedInPeriod?: number;
    paidInPeriod?: number;
    completedInPeriod?: number;
    bookToPaidRate?: number;
    paidToCompletedRate?: number;
    avgOrderValue?: number;
    cancellationRate?: number;
    noShowRate?: number;
  };
  appointmentsTrend: { date: string; appointments: number; revenue: number; completed: number }[];
  serviceBreakdown: { name: string; count: number; revenue: number }[];
  modeBreakdown: { mode: string; count: number }[];
  topDoctors: { name: string; count: number; revenue: number }[];
  userGrowthTrend?: { date: string; newUsers: number }[];
}

const GA_URL = 'https://analytics.google.com';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  if (loading && !data) {
    return <AnalyticsPageSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">Failed to load analytics</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, appointmentsTrend, serviceBreakdown, modeBreakdown, topDoctors, userGrowthTrend } = data;

  const s = summary;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Detailed Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <a
            href={GA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-[#3367d6] text-sm font-medium"
          >
            <BarChart3 className="h-4 w-4" />
            Open Google Analytics
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Lead conversion & Business sales – primary focus */}
      <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-600" />
          Lead Conversion & Business Sales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white/80 rounded-lg p-3 border border-cyan-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">New patients</p>
            <p className="text-lg font-bold text-gray-900">{s.newPatients ?? 0}</p>
            <p className="text-[10px] text-gray-500">signed up in period</p>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-cyan-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Booked → Paid</p>
            <p className="text-lg font-bold text-emerald-600">{s.bookToPaidRate ?? 0}%</p>
            <p className="text-[10px] text-gray-500">conversion rate</p>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-cyan-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Paid → Done</p>
            <p className="text-lg font-bold text-teal-600">{s.paidToCompletedRate ?? 0}%</p>
            <p className="text-[10px] text-gray-500">fulfillment rate</p>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-cyan-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Avg order</p>
            <p className="text-lg font-bold text-gray-900">₹{s.avgOrderValue?.toLocaleString() ?? 0}</p>
            <p className="text-[10px] text-gray-500">per paid appointment</p>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Cancellation</p>
            <p className="text-lg font-bold text-amber-600">{s.cancellationRate ?? 0}%</p>
            <p className="text-[10px] text-gray-500">rate</p>
          </div>
          <div className="bg-white/80 rounded-lg p-3 border border-red-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">No-show</p>
            <p className="text-lg font-bold text-red-600">{s.noShowRate ?? 0}%</p>
            <p className="text-[10px] text-gray-500">rate</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-gray-600">Booked: {(s.bookedInPeriod ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600">Paid: {(s.paidInPeriod ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-gray-600">Completed: {(s.completedInPeriod ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-gray-600">Total patients: {(s.totalPatients ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* User metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500">New patients</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(s.newPatients ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">in last {s.days} days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-cyan-500" />
            <span className="text-xs text-gray-500">Active patients</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(s.activePatientsInPeriod ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">had appointment in period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-500">Repeat customers</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(s.repeatPatients ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">2+ appointments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-gray-500">Book → Paid</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(s.bookToPaidRate ?? 0)}%</p>
          <p className="text-[11px] text-gray-400 mt-0.5">conversion</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-cyan-500" />
            <span className="text-xs text-gray-500">Appointments</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.totalAppointments.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">in last {summary.days} days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-900">₹{summary.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">paid appointments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.completedCount.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {summary.totalAppointments > 0
              ? Math.round((summary.completedCount / summary.totalAppointments) * 100)
              : 0}
            % completion
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Video className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.onlineCount.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {summary.totalAppointments > 0
              ? Math.round((summary.onlineCount / summary.totalAppointments) * 100)
              : 0}
            % of total
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500">Top Doctors</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{topDoctors.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">by appointment count</p>
        </div>
      </div>

      {/* Charts row 1 - Appointments & Revenue full width */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Appointments & Revenue Over Time</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(value, name) => [
                    (name as string) === 'revenue' ? `₹${(Number(value) ?? 0).toLocaleString()}` : (Number(value) ?? 0),
                    (name as string) === 'revenue' ? 'Revenue' : (name as string) === 'appointments' ? 'Appointments' : 'Completed',
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="appointments" stroke="#06b6d4" name="Appointments" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#14b8a6" name="Completed" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0d9488" name="Revenue" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 - User growth & Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New User Signups</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                  formatter={(value: unknown) => [Number(value ?? 0), 'New signups']}
                />
                <Bar dataKey="newUsers" fill="#06b6d4" name="New signups" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Consultation Mode</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeBreakdown.map((m) => ({
                    name: m.mode === 'online' ? 'Online' : m.mode === 'offline' ? 'Clinic' : 'Home Visit',
                    value: m.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {modeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Appointments']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 3 - By Service & Top Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-4">By Service</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, name) => [
                    (name as string) === 'revenue' ? `₹${(Number(value) ?? 0).toLocaleString()}` : (Number(value) ?? 0),
                    (name as string) === 'revenue' ? 'Revenue' : 'Appointments',
                  ]}
                />
                <Bar dataKey="count" fill="#06b6d4" name="Appointments" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" fill="#14b8a6" name="Revenue" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Doctors</h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {topDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm">No data in this period</p>
              </div>
            ) : (
              topDoctors.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <span className="text-gray-600">{d.count} appts</span>
                    <span className="font-medium text-emerald-600">₹{d.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Web traffic & page views: open{' '}
        <a href={GA_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
          Google Analytics
        </a>{' '}
        for detailed website analytics
      </p>
    </div>
  );
}
