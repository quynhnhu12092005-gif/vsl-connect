import { apiRequest, type AuthSession } from '../../services/adminApi';

export type RoomSummary = {
  code: string; title: string; visibility: 'public' | 'private';
  participant_count: number; max_participants: number; created_at: string;
};
export type Participant = {
  id: string; display_name: string; avatar_url: string | null; is_creator: boolean;
  camera_on: boolean; microphone_on: boolean; hand_raised: boolean;
};
export type SignalKind = 'offer' | 'answer' | 'ice' | 'restart';
export type RoomSignal = { id: number; sender_id: string; kind: SignalKind; data: RTCSessionDescriptionInit | RTCIceCandidateInit };
export type RoomState = {
  room: RoomSummary; self_id: string; participants: Participant[];
  signals: RoomSignal[]; cursor: number; lease_seconds: number; poll_interval_ms: number;
};
export type MediaFlags = { camera_on: boolean; microphone_on: boolean; hand_raised: boolean };
export type IceConfiguration = { ice_servers: RTCIceServer[]; relay_configured: boolean; expires_in: number };

export const listRooms = (signal?: AbortSignal) => apiRequest<RoomSummary[]>('/rooms', { signal });
export const roomIce = () => apiRequest<IceConfiguration>('/rooms/ice');
export const createRoom = (title: string, visibility: 'public' | 'private', clientId: string, session: AuthSession) =>
  apiRequest<RoomState>('/rooms', { method: 'POST', csrfToken: session.csrf_token, body: { title, visibility, client_id: clientId } });
export const joinRoom = (code: string, clientId: string, session: AuthSession) =>
  apiRequest<RoomState>('/rooms/join', { method: 'POST', csrfToken: session.csrf_token, body: { code, client_id: clientId } });
export const syncRoom = (code: string, clientId: string, session: AuthSession, after: number, flags: MediaFlags, signal?: AbortSignal) =>
  apiRequest<RoomState>(`/rooms/${code}/sync`, { method: 'POST', csrfToken: session.csrf_token, signal, body: { client_id: clientId, after, ...flags } });
export const sendRoomSignal = (code: string, clientId: string, session: AuthSession, recipientId: string, kind: SignalKind, data: object) =>
  apiRequest<{ accepted: boolean }>(`/rooms/${code}/signals`, { method: 'POST', csrfToken: session.csrf_token,
    body: { client_id: clientId, recipient_id: recipientId, kind, data } });

export function leaveRoom(code: string, clientId: string, session: AuthSession, beacon = false) {
  const body = JSON.stringify({ client_id: clientId, csrf_token: session.csrf_token });
  const url = `/api/v1/rooms/${code}/leave`;
  if (beacon && navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return Promise.resolve();
  return fetch(url, { method: 'POST', credentials: 'same-origin', keepalive: true,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf_token }, body }).then(() => undefined);
}

export function readRoomCode(value: string): string | null {
  let code = value.trim();
  if (/^https?:\/\//i.test(code)) {
    try {
      const path = new URL(code).pathname;
      const match = /^\/giao-tiep\/phong\/([A-Z2-9-]+)\/?$/i.exec(path);
      if (!match) return null;
      code = match[1];
    } catch { return null; }
  }
  code = code.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-HJ-NP-Z2-9]{10}$/.test(code) ? code : null;
}

export const ROOMS_PATH = '/giao-tiep/phong';
export const roomPath = (code: string) => `${ROOMS_PATH}/${code}`;
export const roomInvite = (code: string) => `${window.location.origin}${roomPath(code)}`;

export function roomClientId(code: string): string {
  const key = `vsl-room-client:${code}`;
  try {
    const previous = sessionStorage.getItem(key);
    if (previous && /^[a-f0-9-]{36}$/.test(previous)) return previous;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch { return crypto.randomUUID(); }
}

export function rememberRoomClient(code: string, clientId: string) {
  try { sessionStorage.setItem(`vsl-room-client:${code}`, clientId); } catch { /* joining still works */ }
}

export function rememberRoomReturn(code?: string) {
  try { sessionStorage.setItem('vsl-room-return', code ? roomPath(code) : ROOMS_PATH); } catch { /* user can reopen invite */ }
}

export function takeRoomReturn(): string | null {
  try {
    const value = sessionStorage.getItem('vsl-room-return');
    sessionStorage.removeItem('vsl-room-return');
    return value && /^\/giao-tiep(?:\/phong(?:\/[A-HJ-NP-Z2-9]{10})?)?$/.test(value) ? value : null;
  } catch { return null; }
}
