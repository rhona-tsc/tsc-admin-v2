const clean = value => String(value || '').trim();
const email = value => clean(value).toLowerCase();

// Mirror the sender: both the contact email and the case-sensitive booking
// reference must be allowed. Missing policy must never mean everybody matches.
export function allowedAutomationRecipient(row = {}, allowlist) {
  if (!Array.isArray(allowlist?.emails) || !Array.isArray(allowlist?.bookingRefs)) return '';
  const references = new Set(allowlist.bookingRefs.map(clean).filter(Boolean));
  const reference = clean(row.bookingRef || row.bookingId);
  if (references.size && !references.has(reference)) return '';
  const emails = new Set(allowlist.emails.map(email).filter(Boolean));
  const contacts = [row.clientEmail, ...(Array.isArray(row.clientEmails)
    ? row.clientEmails.map(contact => contact?.email || contact) : [])];
  return contacts.map(email).find(contact => emails.has(contact)) || '';
}
