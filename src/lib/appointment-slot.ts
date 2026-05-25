/**
 * Slot hold rules: only confirmed appointments and short-lived unpaid checkouts block a slot.
 */

export const PAYMENT_HOLD_MINUTES = 15;

export type SlotHoldRow = {
  id?: string;
  status: string;
  payment_status?: string | null;
  created_at?: string | null;
  start_time?: string;
  end_time?: string;
};

/** Whether this appointment row should block the doctor's calendar slot. */
export function holdsSlot(row: SlotHoldRow): boolean {
  const status = (row.status || '').toLowerCase();
  const payment = (row.payment_status || 'pending').toLowerCase();

  if (status === 'cancelled' || status === 'no_show') return false;
  if (payment === 'failed' || payment === 'refunded') return false;

  if (status === 'confirmed' || status === 'completed') return true;

  if (status === 'pending') {
    if (payment === 'paid') return true;
    if (!row.created_at) return false;
    const ageMs = Date.now() - new Date(row.created_at).getTime();
    return ageMs < PAYMENT_HOLD_MINUTES * 60 * 1000;
  }

  return false;
}

export function paymentHoldExpiresAt(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);
}

/** Overlap: slot [start,end) conflicts with appointment [aStart,aEnd). Times HH:MM or HH:MM:SS. */
export function timesOverlap(
  start: string,
  end: string,
  aStart: string,
  aEnd: string
): boolean {
  const s = start.substring(0, 5);
  const e = end.substring(0, 5);
  const as = (aStart || '').substring(0, 5);
  const ae = (aEnd || '').substring(0, 5);
  return s < ae && e > as;
}

export function filterSlotHoldingAppointments<T extends SlotHoldRow>(rows: T[]): T[] {
  return rows.filter(holdsSlot);
}

export function findSlotConflict<T extends SlotHoldRow>(
  rows: T[],
  startTime: string,
  endTime: string,
  excludeId?: string
): T | null {
  for (const row of rows) {
    if (excludeId && row.id === excludeId) continue;
    if (!holdsSlot(row)) continue;
    if (timesOverlap(startTime, endTime, row.start_time || '', row.end_time || '')) {
      return row;
    }
  }
  return null;
}
