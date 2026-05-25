/**
 * H2H Healthcare - Daily.co Video API
 * - Room: always open (nbf in the past); patient access gated by meeting token only
 * - Doctor & super admin: owner tokens, join anytime before exp
 * - Patient: knocking + token nbf near slot time
 */
const DAILY_API = 'https://api.daily.co/v1';
const FETCH_TIMEOUT_MS = 15000;

export type DailyJoinRole = 'admin' | 'doctor' | 'patient';

interface DailyRoom {
  url: string;
  name: string;
  config?: { nbf?: number; exp?: number };
}

interface CreateVideoRoomResult {
  patientUrl: string;
  doctorUrl: string;
  adminUrl: string;
}

export function getDailyRoomName(appointmentId: string): string {
  return `h2h-${appointmentId.replace(/-/g, '').slice(0, 20)}`;
}

function parseSlotTimes(params: {
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
}): { slotStartSec: number; slotEndSec: number } {
  const date = params.appointmentDate || '';
  const start = (params.startTime || '00:00').slice(0, 5);
  const end = (params.endTime || start).slice(0, 5);
  const startIso = `${date}T${start}:00+05:30`;
  const endIso = `${date}T${end}:00+05:30`;
  return {
    slotStartSec: Math.floor(new Date(startIso).getTime() / 1000),
    slotEndSec: Math.floor(new Date(endIso).getTime() / 1000),
  };
}

async function dailyFetch(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<unknown> {
  const key = process.env.DAILY_API_KEY?.trim();
  if (!key || key.length < 20) throw new Error('DAILY_API_KEY not configured or invalid');

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${DAILY_API}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        ...options.headers,
      },
    });
    clearTimeout(id);
    if (!res.ok) {
      const err = await res.text();
      const isRetryable = res.status >= 500 || res.status === 429;
      if (isRetryable && retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return dailyFetch(endpoint, options, retries - 1);
      }
      const e = new Error(`Daily API: ${res.status} ${err}`) as Error & { status?: number };
      e.status = res.status;
      throw e;
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (e: unknown) {
    clearTimeout(id);
    const err = e as { name?: string };
    if (err.name === 'AbortError' && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      return dailyFetch(endpoint, options, retries - 1);
    }
    throw e;
  }
}

function roomProperties(slotEndSec: number): Record<string, unknown> {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    nbf: nowSec - 86400,
    exp: Math.max(slotEndSec + 7200, nowSec + 86400),
    enable_knocking: true,
    enable_prejoin_ui: true,
  };
}

/** Create or refresh room so hosts can join immediately (clears legacy future nbf on existing rooms). */
async function ensureDailyRoom(roomName: string, slotEndSec: number): Promise<DailyRoom> {
  const props = roomProperties(slotEndSec);
  const encoded = encodeURIComponent(roomName);

  try {
    const existing = (await dailyFetch(`/rooms/${encoded}`)) as DailyRoom;
    const exp = existing?.config?.exp ?? 0;
    const nowSec = Math.floor(Date.now() / 1000);

    if (exp > 0 && exp < nowSec) {
      await dailyFetch(`/rooms/${encoded}`, { method: 'DELETE' });
    } else if (existing?.url) {
      const updated = (await dailyFetch(`/rooms/${encoded}`, {
        method: 'POST',
        body: JSON.stringify({ properties: props }),
      })) as DailyRoom;
      return { url: updated?.url || existing.url, name: roomName };
    }
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status !== 404) throw e;
  }

  const room = (await dailyFetch('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: props,
    }),
  })) as DailyRoom & { url?: string };

  if (!room?.url) {
    throw new Error(`Daily API: room created but no url in response: ${JSON.stringify(room)}`);
  }
  return { url: room.url, name: roomName };
}

async function createMeetingToken(props: {
  roomName: string;
  userName: string;
  isOwner: boolean;
  exp: number;
  nbf?: number;
  knocking?: boolean;
}): Promise<string> {
  const properties: Record<string, unknown> = {
    room_name: props.roomName,
    is_owner: props.isOwner,
    user_name: props.userName,
    exp: props.exp,
    eject_at_token_exp: false,
  };
  if (props.nbf != null) properties.nbf = props.nbf;
  if (props.knocking) properties.knocking = true;

  const res = (await dailyFetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  })) as { token?: string };

  if (!res.token) throw new Error('Daily API: meeting token missing in response');
  return res.token;
}

/**
 * Fresh join URL. Hosts (admin/doctor) can always enter and start the call; patients use lobby until admitted.
 */
export async function issueDailyJoinUrl(params: {
  appointmentId: string;
  role: DailyJoinRole;
  doctorName?: string;
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
}): Promise<string> {
  const roomName = getDailyRoomName(params.appointmentId);
  const { slotStartSec, slotEndSec } = parseSlotTimes({
    appointmentDate: params.appointmentDate,
    startTime: params.startTime,
    endTime: params.endTime,
  });
  const nowSec = Math.floor(Date.now() / 1000);
  const tokenExp = Math.max(slotEndSec + 7200, nowSec + 86400);
  const room = await ensureDailyRoom(roomName, slotEndSec);
  const doctorName = (params.doctorName || 'Doctor').replace(/^Dr\.?\s*/i, '');

  if (params.role === 'patient') {
    const PATIENT_EARLY_MINS = 15;
    const patientNbf = Math.max(slotStartSec - PATIENT_EARLY_MINS * 60, nowSec - 60);
    const token = await createMeetingToken({
      roomName,
      userName: 'Patient',
      isOwner: false,
      exp: tokenExp,
      nbf: patientNbf,
      knocking: true,
    });
    return `${room.url}?t=${token}`;
  }

  if (params.role === 'doctor') {
    const token = await createMeetingToken({
      roomName,
      userName: `Dr. ${doctorName}`,
      isOwner: true,
      exp: tokenExp,
    });
    return `${room.url}?t=${token}`;
  }

  const token = await createMeetingToken({
    roomName,
    userName: 'H2H Admin',
    isOwner: true,
    exp: tokenExp,
  });
  return `${room.url}?t=${token}`;
}

function formatIST(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    time: date.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

export async function createVideoRoom(params: {
  appointmentId: string;
  doctorName: string;
  appointmentStartTime: Date;
  appointmentEndTime: Date;
}): Promise<CreateVideoRoomResult> {
  const start = formatIST(params.appointmentStartTime);
  const end = formatIST(params.appointmentEndTime);

  const [patientUrl, doctorUrl, adminUrl] = await Promise.all([
    issueDailyJoinUrl({
      appointmentId: params.appointmentId,
      role: 'patient',
      doctorName: params.doctorName,
      appointmentDate: start.date,
      startTime: start.time,
      endTime: end.time,
    }),
    issueDailyJoinUrl({
      appointmentId: params.appointmentId,
      role: 'doctor',
      doctorName: params.doctorName,
      appointmentDate: start.date,
      startTime: start.time,
      endTime: end.time,
    }),
    issueDailyJoinUrl({
      appointmentId: params.appointmentId,
      role: 'admin',
      doctorName: params.doctorName,
      appointmentDate: start.date,
      startTime: start.time,
      endTime: end.time,
    }),
  ]);

  return { patientUrl, doctorUrl, adminUrl };
}
