# H2H Video Consultation – Production Guide

## Overview

Online consultations use **Jitsi Meet** (free fallback) or **Daily.co** (doctor/admin as host with waiting room).

- **Patient**: Joins lobby; must request access; doctor/admin admits. One-time entry per consultation.
- **Doctor**: Host with full permissions; admits patients, controls call.
- **Super admin**: Host with full permissions; can join and admit patients.

## Free Tier & Limits

### Jitsi Meet (Default – No API Key)

| Item | Limit |
|------|-------|
| Cost | Free |
| Duration | Unlimited (1hr, 2hr+ supported) |
| Host | First person to join |
| Setup | None |

### Daily.co (When `DAILY_API_KEY` is set)

| Item | Limit |
|------|-------|
| Free minutes/month | **10,000** |
| Duration | Unlimited (1hr+ supported) |
| Host | Doctor and super admin (owner tokens) |
| Room validity | 2 hours after appointment end |
| **Auto-close** | Meeting ends at slot end (15/20 min); all participants ejected |
| **Meeting window** | Join from 15 min before slot; auto-eject at slot end |

**Approximate usage:**
- 1hr call (doctor + patient) ≈ 120 participant-minutes  
- 10,000 free minutes ≈ 83 one-hour calls/month  
- Typical 15min slot ≈ 30 minutes ≈ 333 consultations/month free  

## Production Checklist

- [ ] **DAILY_API_KEY** – Optional. If set, doctor and super admin join as host.
- [ ] **Jitsi fallback** – Always used if Daily fails or no key.
- [ ] **Payment safety** – Payment never fails due to video; always falls back to Jitsi.
- [ ] **Metadata merge** – Existing metadata fields (e.g. `booked_at`, `center_id`) are preserved.
- [ ] **Timeout** – Daily API calls use 15s timeout.
- [ ] **Retries** – One retry for transient failures (5xx, 429).
- [ ] **Timezone** – Appointment end times parsed as Asia/Kolkata (IST).
- [ ] **Room expiry** – Room valid until 2 hours after appointment end.
- [ ] **Auto-close** – Meeting ends at slot end; doctor and patient ejected.

## Environment Variables

```env
# Optional – enables doctor/admin as host (no "become moderator" prompt)
DAILY_API_KEY=your-daily-api-key
```

Get the key from [dashboard.daily.co](https://dashboard.daily.co) → Developers → API Keys.

**Important:** After adding `DAILY_API_KEY` to `.env`:
1. **Restart the dev server** (`npm run dev`) – env vars load at startup.
2. **Create a new booking** – existing appointments keep their old links (Jitsi or Daily).
3. Patient gets Daily room URL; doctor and super admin get URLs with owner token (host).

## Flow Summary

1. Patient books online consultation.
2. Patient pays via Razorpay.
3. On payment success (verify or webhook):
   - If `DAILY_API_KEY` is set: create Daily.co private room with waiting room; patient gets lobby link, doctor/admin get host links.
   - If not set or Daily fails: create Jitsi Meet link (single URL for all).
4. **Daily.co**: Patient joins lobby → requests access → doctor enters with host link → doctor admits patient → call starts.
5. **Auto-close**: At slot end (15/20 min booked duration), the meeting ends for everyone; doctor and patient are both ejected.

## Test Daily Connectivity

`GET /api/video/test` returns whether Daily API is reachable:

- `{ "ok": true, "provider": "daily" }` – Key valid; new bookings use Daily links.
- `{ "ok": false, "error": "..." }` – Invalid key, network, or key not set. Check `.env` and restart server.

## Troubleshooting

- **Seeing Jitsi (meet.jit.si) instead of Daily** – Test with `GET /api/video/test`. If `ok: false`, fix `DAILY_API_KEY` and restart the server. New appointments only; old ones keep existing links.
- **Doctor not host** – Ensure `DAILY_API_KEY` is set. With Jitsi, only the first joiner is host.
- **“Meeting code invalid”** – Jitsi uses `https://meet.jit.si/h2h-{appointmentId}`. Daily uses `https://*.daily.co/...`.
- **Room expired** – Daily rooms expire 2 hours after appointment end. Reschedule if needed.
- **Video creation failed** – Check logs for “Video room creation failed, using Jitsi fallback”. Payment still succeeds; Jitsi link is used.
- **Patient stuck in waiting room** – Doctor must join with their host link (from dashboard) and admit the patient from the People/waiting list.
- **Doctor "End for everyone"** – Use the "End for everyone" button on the doctor or super-admin appointments page (Daily.co only) to end the call for all participants.
- **"This meeting is not available yet"** – Usually means you opened the Daily room URL **without** the `?t=...` host token. **Doctor / super admin:** click **Start / Join as Host** in the dashboard (calls `/api/video/join-url`, refreshes the room, mints an owner token). Never paste the bare `h2hcare.daily.co/h2h-...` link. **Patients** see this until 15 minutes before the slot (by design).
