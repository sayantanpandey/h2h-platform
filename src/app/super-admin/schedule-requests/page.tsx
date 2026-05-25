'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StackedCardsSkeleton } from '@/components/admin/AdminSkeletons';
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
} from 'lucide-react';

interface ScheduleRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  requestType: string;
  payload: { days?: number[] };
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  daysLabel: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export default function ScheduleRequestsPage() {
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/super-admin/schedule-requests?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/super-admin/schedule-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', reviewNotes: reviewNotes[id] || null }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewNotes((prev) => ({ ...prev, [id]: '' }));
        await fetchRequests();
      } else {
        setError(data.error || 'Failed to approve');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/super-admin/schedule-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reviewNotes: reviewNotes[id] || null }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewNotes((prev) => ({ ...prev, [id]: '' }));
        await fetchRequests();
      } else {
        setError(data.error || 'Failed to reject');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Schedule change requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Doctors request to mark days unavailable. Approve to update their schedule.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <StackedCardsSkeleton count={4} />
      ) : requests.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No schedule change requests found.</p>
            <p className="text-sm mt-1">When doctors submit requests, they will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id} className="border-gray-200 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{r.doctorName}</span>
                      <span className="text-sm text-gray-500">({r.doctorEmail})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{r.daysLabel}</span>
                    </div>
                    {r.reason && (
                      <p className="text-sm text-gray-500 mt-1 pl-6">Reason: {r.reason}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Requested {formatDate(r.createdAt)}
                    </p>
                    {r.status === 'pending' && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Admin note (optional)</label>
                        <textarea
                          value={reviewNotes[r.id] ?? ''}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          placeholder="Optional note for doctor..."
                          className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(r.id)}
                          disabled={processingId === r.id}
                        >
                          {processingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(r.id)}
                          disabled={processingId === r.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    )}
                    {r.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                      </Badge>
                    )}
                  </div>
                </div>
                {r.reviewNotes && r.status !== 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                    Admin note: {r.reviewNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
