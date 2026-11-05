import { useEffect, useState } from 'react';
import SectionLink from './OriginalsSectionLink';
import { formatOriginalsDeadline } from '../utils/originalsDeadlines';

export default function OriginalsReviewDeadline({ plan, isOwner }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  if (!plan?.reviewDueAt) return null;
  const overdue = now >= new Date(plan.reviewDueAt).getTime();
  return <aside className={`mt-4 rounded-xl border p-4 text-sm ${overdue ? 'border-amber-300 bg-amber-50' : 'bg-sky-50'}`} aria-label="Submission review deadline">
    <h2 className="font-bold uppercase tracking-wide">{overdue ? 'Review overdue — TSC can help' : 'Recording awaiting review'}</h2>
    <p className="mt-2">Review due {formatOriginalsDeadline(plan.reviewDueAt)} — seven days after the latest submission in this round. {overdue ? isOwner ? 'TSC can review the recordings on your behalf to keep your project moving.' : 'You can review the recordings on the owner’s behalf, choose the best fit and confirm the next round.' : 'If the owner has not responded by then, TSC can review on their behalf.'}</p>
    {plan.nextRound?.fromPreference && <p className="mt-2">Owner’s preferred next round: <strong>{plan.nextRound.roleName}</strong>. This remains a suggestion; it can be changed when opening the round.</p>}
    <SectionLink to="project-review">Review submissions</SectionLink>
  </aside>;
}
