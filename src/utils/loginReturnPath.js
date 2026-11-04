export function safeLoginReturnPath(value, fallback = '/musicians-dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || (value.includes('\\') || Array.from(value).some(character => character.charCodeAt(0) < 32))) return fallback;
  if (/^\/(?:login|security|list|moderate|moderate-deputies)(?:[/?#]|$)/.test(value)) return fallback;
  return value;
}

export function loginReturnPath(location = {}) {
  const query = new URLSearchParams(location.search || '').get('next');
  return safeLoginReturnPath(location.state?.from || query);
}

export function loginPathFor(location = {}) {
  const path = safeLoginReturnPath(`${location.pathname || '/'}${location.search || ''}${location.hash || ''}`);
  return `/login?next=${encodeURIComponent(path)}`;
}
