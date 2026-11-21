import { jwtDecode } from 'jwt-decode';

// This only chooses the signed-in UI. The server still verifies every request.
export function activeSessionToken(token, now = Date.now()) {
  if (!token) return '';
  try {
    const payload = jwtDecode(token);
    if (!payload || typeof payload !== 'object' || payload.purpose === 'musician_email_preferences') return '';
    if (!(payload.id || payload._id || payload.userId)) return '';
    if (payload.exp !== undefined && (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now)) return '';
    if (payload.nbf !== undefined && (!Number.isFinite(payload.nbf) || payload.nbf * 1000 > now)) return '';
    return token;
  } catch { return ''; }
}

export function storedSessionToken(storage = localStorage) {
  const saved = storage.getItem('token') || '';
  const active = activeSessionToken(saved);
  if (saved && !active) storage.removeItem('token');
  return active;
}
