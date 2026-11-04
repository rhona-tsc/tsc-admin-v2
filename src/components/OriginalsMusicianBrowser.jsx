import React, { useEffect, useId, useRef, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';

const publicSite = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://thesupremecollective.co.uk').replace(/\/+$/, '');
const sorted = values => [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b, 'en'));

export default function OriginalsMusicianBrowser({ token, projectId, initialInstrument = '', ownerLookup = false, selectedId = '', onSelect, disabled = false }) {
  const radioName = useId();
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const haveFilters = useRef(false);
  const [draft, setDraft] = useState({ q: '', instrument: initialInstrument, genre: '' });
  const [applied, setApplied] = useState({ q: '', instrument: initialInstrument, genre: '', page: 1 });
  const [filters, setFilters] = useState({ instruments: [], genres: [] });
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasMore: false, hasPrevious: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    selectRef.current?.(''); setBusy(true); setError(''); setResults([]);
    const params = { ...applied, ...(ownerLookup ? { projectId } : {}), ...(!haveFilters.current ? { includeFilters: 'true' } : {}) };
    originalsRequest(token, { method: 'get', url: ownerLookup ? '/musicians/search' : `/projects/${projectId}/musicians`, params, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setResults(data.musicians || []);
        setPagination(data.pagination || { page: 1, hasMore: false, hasPrevious: false });
        if (data.filters) { setFilters(data.filters); haveFilters.current = true; }
      })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Could not load musicians. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, projectId, ownerLookup, applied, retry]);
  const changeFilter = (field, value) => {
    const next = { ...draft, [field]: value };
    setDraft(next); setApplied({ ...next, q: next.q.trim(), page: 1 });
    selectRef.current?.('');
  };
  const search = () => { selectRef.current?.(''); setApplied({ ...draft, q: draft.q.trim(), page: 1 }); };
  const changePage = page => { selectRef.current?.(''); setApplied(current => ({ ...current, page })); };
  return <div className="space-y-3" aria-label={ownerLookup ? 'Musicians to invite' : 'Musicians to recommend'}>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Instrument<select aria-label="Filter musicians by instrument" value={draft.instrument} disabled={disabled} onChange={event => changeFilter('instrument', event.target.value)} className="mt-1 w-full min-w-0 rounded border bg-white p-2 font-normal"><option value="">All instruments</option>{sorted([initialInstrument, draft.instrument, ...filters.instruments]).map(instrument => <option key={instrument}>{instrument}</option>)}</select></label>
      <label className="text-sm font-medium">Genre<select aria-label="Filter musicians by genre" value={draft.genre} disabled={disabled} onChange={event => changeFilter('genre', event.target.value)} className="mt-1 w-full min-w-0 rounded border bg-white p-2 font-normal"><option value="">All genres</option>{filters.genres.map(genre => <option key={genre}>{genre}</option>)}</select></label>
    </div>
    <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm font-medium">{ownerLookup ? 'Name or email (optional)' : 'Name (optional)'}<input aria-label="Musician name" value={draft.q} disabled={disabled} maxLength={80} onChange={event => setDraft(current => ({ ...current, q: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); search(); } }} placeholder="Leave blank to browse everyone matching the filters" className="mt-1 w-full min-w-0 rounded border p-2 font-normal" /></label><button type="button" disabled={disabled || busy} onClick={search} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Search</button></div>
    <p className="text-xs text-gray-600">Genres are the choices saved on each musician’s profile. Open a public profile to check their audio, video and style before choosing someone.</p>
    {busy ? <p role="status" className="text-sm text-gray-600">Loading musicians…</p> : error ? <div role="alert" className="text-sm text-red-700">{error} <button type="button" disabled={disabled} onClick={() => setRetry(value => value + 1)} className="underline">Try again</button></div> : <>
      {!results.length ? <p role="status" className="rounded bg-slate-50 p-3 text-sm text-gray-600">No musicians match these filters. Try another instrument, genre or name.</p> : <>
        <p role="status" className="text-xs text-gray-600">Page {pagination.page} · {results.length} musician{results.length === 1 ? '' : 's'} shown{pagination.hasMore ? ' · more available on the next page' : ''}</p>
        <ul className="grid gap-3 sm:grid-cols-2">{results.map(musician => <li key={musician._id} className="min-w-0 rounded-lg border bg-slate-50 p-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold"><input type="radio" name={radioName} value={musician._id} checked={String(selectedId) === String(musician._id)} disabled={disabled} onChange={() => onSelect?.(musician._id, musician)} className="mt-1" /><span className="min-w-0 break-words">{musician.displayName}</span></label>
          <p className="mt-2 break-words text-xs text-gray-600">{musician.instruments?.length ? musician.instruments.join(', ') : 'Instruments not yet listed'}</p>
          <p className="mt-1 break-words text-xs text-gray-600">{musician.genres?.length ? musician.genres.join(' · ') : 'Genres not yet selected'}</p>
          {musician.profilePath && <a href={`${publicSite}${musician.profilePath}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium underline" aria-label={`View ${musician.displayName}’s profile`}>View profile & listen</a>}
        </li>)}</ul>
      </>}
      {(pagination.hasPrevious || pagination.hasMore) && <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={disabled || !pagination.hasPrevious} onClick={() => changePage(pagination.page - 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Previous musicians</button><span className="text-xs text-gray-600">Page {pagination.page}</span><button type="button" disabled={disabled || !pagination.hasMore} onClick={() => changePage(pagination.page + 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Next musicians</button></div>}
    </>}
  </div>;
}
