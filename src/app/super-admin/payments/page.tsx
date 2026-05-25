'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Calendar, CreditCard, IndianRupee, CheckCircle2, XCircle, 
  AlertCircle, Loader2, RefreshCw, Download, Filter, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminContentSkeleton } from '@/components/admin/AdminSkeletons';
import { format, parseISO, isToday, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  created_at: string;
  updated_at: string;
  appointment?: {
    id: string;
    appointment_date: string;
    start_time: string;
    mode: string;
    patient?: { full_name: string; email: string; phone: string | null };
    doctor?: { users: { full_name: string } };
    service?: { name: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (data.success) {
        setPayments(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch payments');
      }
    } catch (err) {
      setError('Failed to fetch payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: payments.length,
    totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
    failed: payments.filter(p => p.status === 'failed').length,
    thisMonth: payments.filter(p => {
      const date = parseISO(p.created_at);
      return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
    }).reduce((sum, p) => p.status === 'paid' ? sum + p.amount : sum, 0),
    lastMonth: payments.filter(p => {
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
      const date = parseISO(p.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).reduce((sum, p) => p.status === 'paid' ? sum + p.amount : sum, 0),
  };

  const growthPercent = stats.lastMonth > 0 
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100) 
    : 100;

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    // Search filter
    const patientName = payment.appointment?.patient?.full_name || '';
    const patientEmail = payment.appointment?.patient?.email || '';
    const transactionId = payment.razorpay_payment_id || '';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      patientName.toLowerCase().includes(searchLower) ||
      patientEmail.toLowerCase().includes(searchLower) ||
      transactionId.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = isToday(parseISO(payment.created_at));
    } else if (dateFilter === 'this_month') {
      const date = parseISO(payment.created_at);
      matchesDate = date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return <AdminContentSkeleton variant="table" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all payment transactions</p>
        </div>
        <Button onClick={fetchPayments} variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />{error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-cyan-600" />
            </div>
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 flex items-center">
            <IndianRupee className="h-5 w-5" />{stats.totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-1 text-sm">
            {growthPercent >= 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-green-600">+{growthPercent}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                <span className="text-red-600">{growthPercent}%</span>
              </>
            )}
            <span className="text-gray-400">vs last month</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Transactions</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          <p className="text-sm text-gray-500">Successful</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-purple-600">{stats.refunded}</p>
          <p className="text-sm text-gray-500">Refunded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by patient name, email, or transaction ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="px-4 py-2 border rounded-lg bg-white min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)} 
          className="px-4 py-2 border rounded-lg bg-white min-w-[140px]"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payments found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {format(parseISO(payment.created_at), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(payment.created_at), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.appointment?.patient?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.appointment?.patient?.email || ''}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.appointment?.service?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Dr. {(payment.appointment?.doctor?.users?.full_name || 'N/A').replace(/^Dr\.?\s*/i, '')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900 flex items-center">
                        <IndianRupee className="h-3 w-3" />{payment.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`${STATUS_COLORS[payment.status]} capitalize`}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-mono text-gray-500">
                        {payment.razorpay_payment_id || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
