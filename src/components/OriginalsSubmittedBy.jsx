const publicSite = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://thesupremecollective.co.uk').replace(/\/+$/, '');

export default function OriginalsSubmittedBy({ credit, dark = false }) {
  if (!credit) return null;
  const profilePath = !credit.anonymous && credit.profilePath?.startsWith('/musician/') ? credit.profilePath : null;
  return <p className={`mt-1 break-words text-xs ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Submitted by{' '}
    {profilePath ? <a href={`${publicSite}${profilePath}`} target="_blank" rel="noopener noreferrer" className="font-medium underline" aria-label={`View ${credit.displayName}’s musician profile`}>{credit.displayName}</a> : <span className="font-medium">{credit.displayName || 'Anonymous'}</span>}
  </p>;
}
