export const isEncoreEnquiry = agent => String(agent || '').trim().toLowerCase() === 'encore';

export function enquiryClientEmailError(agent, email) {
  const value = String(email || '').trim();
  if (!value && isEncoreEnquiry(agent)) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? '' : 'Please add a valid Client Email (optional for Encore enquiries).';
}
