import { useEffect, useState } from 'react';
import { cloudinaryImage } from '../utils/cloudinaryImage';

const publicSite = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://thesupremecollective.co.uk').replace(/\/+$/, '');

export default function OriginalsApprovedContributor({ credit }) {
  const [failedPhoto, setFailedPhoto] = useState(false);
  const photo = !credit.anonymous && /^https?:\/\//i.test(credit.profilePhoto || '') ? credit.profilePhoto : '';
  useEffect(() => setFailedPhoto(false), [photo]);
  const profilePath = !credit.anonymous && credit.profilePath?.startsWith('/musician/') ? credit.profilePath : null;
  const name = credit.displayName || (credit.anonymous ? 'Anonymous' : 'Project participant');
  const identity = <>
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15">
      {photo && !failedPhoto ? <img src={cloudinaryImage(photo, 64)} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailedPhoto(true)} />
        : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" /></svg>}
    </span>
    <span><span className={profilePath ? 'underline underline-offset-2' : ''}>{name}</span>’s recording approved</span>
  </>;
  return <p className="mt-2 text-xs text-gray-600" aria-label="Recording status">
    {profilePath ? <a href={`${publicSite}${profilePath}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${name}’s musician profile`} className="inline-flex min-w-0 items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{identity}</a>
      : <span className="inline-flex min-w-0 items-center gap-2">{identity}</span>}
  </p>;
}
