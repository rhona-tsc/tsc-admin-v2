import { useCallback, useEffect, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';

export default function useOriginalsOwnerAgreement(token) {
  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => { setAgreement(null); setError(''); setAttempt(value => value + 1); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setAgreement(null); setError('');
    originalsRequest(token, { method: 'get', url: '/owner-agreement', signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const document = data.agreement;
        if (!document?.version || !document.textHash || !document.acknowledgement || document.type !== 'owner' ||
            !Array.isArray(document.sections) || !document.sections.length || document.sections.some(section => !section.title || !section.text)) {
          throw new Error('Agreement unavailable');
        }
        setAgreement(document);
      })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Could not load the owner agreement. Please try again.'); });
    return () => controller.abort();
  }, [token, attempt]);
  return { agreement, error, reload };
}
