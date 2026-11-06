import OriginalsRevisionControls from './OriginalsRevisionControls';
import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { originalsRequest } from '../utils/originalsApi';
import { originalStemSubmission } from '../utils/originalsSubmission';
import { formatOriginalsDeadline } from '../utils/originalsDeadlines';
import OriginalsRecordingGuide from './OriginalsRecordingGuide';
import OriginalsAiDeclaration from './OriginalsAiDeclaration';
import OriginalsFilesPlayback from './OriginalsFilesPlayback';
import { EmbeddedReference } from './OriginalsProjectListening';
import SectionLink from './OriginalsSectionLink';

const heading = 'text-sm font-bold uppercase tracking-wide text-slate-800';
const idOf = value => String(value?._id || value || '');

function ReferenceUpload({ token, projectId, roundId, disabled, onBusyChange, onRefresh }) {
  const input = useRef(null);
  const [kind, setKind] = useState('demo'), [file, setFile] = useState(null), [ai, setAi] = useState(false), [error, setError] = useState('');
  const upload = async () => {
    if (!file || disabled) return;
    setError(''); onBusyChange(true);
    try {
      const body = new FormData(); body.append('file', file); body.append('kind', kind);
      if (roundId) body.append('roundId', roundId);
      if (['initial_stem', 'click_track'].includes(kind)) body.append('createdEntirelyWithAi', String(ai));
      await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/assets`, data: body });
      setFile(null); setAi(false); if (input.current) input.current.value = '';
      await onRefresh(); toast.success('Project reference uploaded');
    } catch (failure) { setError(failure.response?.data?.message || 'Could not upload the project reference.'); }
    finally { onBusyChange(false); }
  };
  return <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Owner tools: add a project reference</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
      <label className="text-sm">Reference type<select aria-label="Project reference type" value={kind} disabled={disabled} onChange={event => { setKind(event.target.value); setAi(false); }} className="mt-1 w-full rounded border p-2">{[['demo', 'Demo'], ['guide_track', 'Guide track'], ['video_submission', 'Video sample'], ['click_track', 'Click track'], ['initial_stem', 'Initial stem']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="min-w-0 text-sm">Choose reference file<input ref={input} type="file" disabled={disabled} accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mov" onChange={event => { setFile(event.target.files?.[0] || null); setAi(false); }} className="mt-1 w-full min-w-0 max-w-full rounded border p-2" /></label>
      <button type="button" disabled={disabled || !file} onClick={upload} className="self-end rounded border px-3 py-2 text-sm font-semibold disabled:opacity-40">Upload reference</button>
    </div>
    {file && ['initial_stem', 'click_track'].includes(kind) && <OriginalsAiDeclaration checked={ai} onChange={setAi} disabled={disabled} />}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </details>;
}

// One form owns the current reservation, its uploads and the final submission.
// The reservation is supplied by the workspace; future holds are never offered.
export default function OriginalsContributionForm({ token, project, currentRound, reservation, assets = [], submissions = [], viewerId, submittedReservation, canManage = false, readOnly = false, busy = false, onBusyChange, onRefresh, onReviewAssets }) {
  const isProduction = ['mix', 'master'].includes(currentRound?.type);
  const kind = isProduction ? currentRound.type : 'take_stem';
  const role = reservation?.roleName || currentRound?.roleName || '';
  const [deletedIds, setDeletedIds] = useState([]);
  const visibleAssets = assets.filter(asset => asset.state !== 'deleted' && !deletedIds.includes(idOf(asset._id)));
  const available = reservation ? visibleAssets.filter(asset => asset.state === 'active' && asset.kind === kind && idOf(asset.ownerId) === idOf(viewerId) && idOf(asset.reservationId) === idOf(reservation._id)) : [];
  const submitted = submissions.find(item => idOf(item.musicianId) === idOf(viewerId) && idOf(item.roundId) === idOf(currentRound?._id) && item.state === 'submitted');
  const editing = submitted?.revisionSession?.status === 'editing';
  const submittedIds = new Set(submitted ? [submitted, ...(submitted.previousVersions || [])].flatMap(version => [version.outputAssetId, ...(version.takes || []).flatMap(take => [...(take.stemAssetIds || [take.stemAssetId]), take.mixdownAssetId, take.wetStemAssetId])].filter(Boolean).map(idOf)) : []);
  const input = useRef(null);
  const [files, setFiles] = useState([]), [ai, setAi] = useState(false), [working, setWorking] = useState(''), [error, setError] = useState('');
  const [selected, setSelected] = useState(() => available.slice(0, isProduction ? 1 : 4).map(asset => idOf(asset._id)));
  const [effects, setEffects] = useState(() => Object.fromEntries((submitted?.takes || []).map(take => [idOf(take.stemAssetId), take.effects === 'with_effects' ? 'with_effects' : 'without_effects']))), [songwriting, setSongwriting] = useState(submitted?.songwritingChoice === 'songwriting_claim'), [notes, setNotes] = useState(submitted?.notes || '');
  const disabled = busy || Boolean(working) || readOnly;
  const draft = { reservationId: idOf(reservation?._id), stemAssetIds: selected, effectsByAssetId: effects };
  const stemSubmission = originalStemSubmission(draft, visibleAssets);
  const productionReady = selected.length === 1 && available.some(asset => idOf(asset._id) === selected[0]);
  const pendingAlignment = available.filter(asset => selected.includes(idOf(asset._id)) && asset.alignmentReviewRequired && !asset.alignmentReview?.reviewedAt);
  const otherFiles = visibleAssets.filter(asset => !available.some(own => idOf(own._id) === idOf(asset._id)));
  const setWorkingState = value => { setWorking(value); onBusyChange(Boolean(value)); };

  const upload = async () => {
    if (!files.length || disabled || !reservation) return;
    if (files.length > (isProduction ? 1 : 4)) { setError(isProduction ? 'Choose one finished output to upload.' : 'Choose up to four stems at a time.'); return; }
    setError(''); setWorkingState('upload');
    const uploaded = [];
    try {
      for (const file of files) {
        const body = new FormData(); body.append('file', file); body.append('kind', kind);
        body.append('roundId', currentRound._id); body.append('reservationId', reservation._id);
        if (!isProduction) body.append('createdEntirelyWithAi', String(ai));
        const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${project._id}/assets`, data: body });
        uploaded.push(idOf(data.asset._id));
        setSelected(value => isProduction ? [idOf(data.asset._id)] : [...new Set([...value, idOf(data.asset._id)])].slice(0, 4));
        setFiles(value => value.filter(item => item !== file));
      }
      setAi(false);
    } catch (failure) { setError(failure.response?.data?.message || 'The upload did not finish. Your uploaded files are kept; try the remaining files again.'); }
    finally {
      if (input.current) input.current.value = '';
      try { if (uploaded.length) { await onRefresh(); if (!isProduction) onReviewAssets(uploaded); } }
      finally { setWorkingState(''); }
    }
  };

  const submit = async () => {
    if (disabled || !reservation) return;
    if (isProduction ? !productionReady : !stemSubmission.ready) return;
    if (!isProduction) {
      const pending = available.filter(asset => selected.includes(idOf(asset._id)) && asset.alignmentReviewRequired && !asset.alignmentReview?.reviewedAt);
      if (pending.length) { onReviewAssets(pending.map(asset => idOf(asset._id))); return; }
    }
    setError(''); setWorkingState('submit');
    try {
      await originalsRequest(token, { method: 'post', url: `/reservations/${reservation._id}/${isProduction ? 'production-submissions' : 'submissions'}`, data: isProduction
        ? { outputAssetId: selected[0], notes }
        : { takes: stemSubmission.takes, songwritingChoice: songwriting ? 'songwriting_claim' : 'master_only', notes } });
      toast.success(isProduction ? `${currentRound.type === 'mix' ? 'Mix' : 'Master'} submitted for review` : 'Take submitted for review');
      await onRefresh();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Could not submit your recording. Your uploaded files and choices are kept.');
      if (failure.response?.data?.code === 'ORIGINALS_ALIGNMENT_REVIEW_REQUIRED') onReviewAssets([failure.response.data.assetId]);
    } finally { setWorkingState(''); }
  };

  const deleteUpload = async assetId => {
    if (disabled || !reservation || (submitted && !editing) || submittedIds.has(assetId)) return;
    setError(''); setWorkingState(`delete:${assetId}`);
    try {
      await originalsRequest(token, { method: 'delete', url: `/assets/${assetId}` });
      setDeletedIds(value => [...value, assetId]);
      setSelected(value => value.filter(id => id !== assetId));
      setEffects(value => { const next = { ...value }; delete next[assetId]; return next; });
      toast.success('Uploaded recording deleted');
      try { await onRefresh(); }
      catch { setError('Recording deleted. Refresh the page to update the project files.'); }
    } catch (failure) { setError(failure.response?.data?.message || 'Could not delete the recording. Your file and choices are kept; please try again.'); }
    finally { setWorkingState(''); }
  };

  const toggle = (assetId, include) => setSelected(value => isProduction ? [assetId] : include ? [...value, assetId].slice(0, 4) : value.filter(id => id !== assetId));
  return <section id="submit-take" tabIndex={-1} className="scroll-mt-6 mt-4 min-w-0 rounded-xl border bg-white p-4 sm:p-5">
    <span id="project-files" tabIndex={-1} className="scroll-mt-6" />
    <h2 className={heading}>{reservation ? `${editing ? 'Revise & resubmit your' : 'Upload & submit your'} ${isProduction ? currentRound.type : 'take'}${!isProduction && role ? ` — ${role}` : ''}` : 'Your recordings & project files'}</h2>
    {submitted && <OriginalsRevisionControls token={token} submission={submitted} reservation={reservation || submittedReservation} currentRoundId={currentRound?._id} disabled={disabled} onBusyChange={onBusyChange} onRefresh={onRefresh} />}
    {reservation && <>
      <OriginalsRecordingGuide productionType={isProduction ? currentRound.type : ''} />
      <p className="mt-4 text-sm text-gray-600">{isProduction ? `Upload your finished ${currentRound.type}, listen back, then send it for review.` : 'Upload your part on its own, check the preview, then submit below. You can send up to four stems together.'}</p>
      <p className="mt-1 text-xs text-gray-500">Your {role} reservation ends {formatOriginalsDeadline(reservation.expiresAt)}.</p>
      <div className="mt-4 rounded-lg border bg-slate-50 p-3 sm:p-4">
        <label className="block min-w-0 text-sm font-semibold">{isProduction ? `Upload your ${currentRound.type} output` : `Upload your ${role} stem${files.length > 1 ? 's' : ''}`}
          <input ref={input} aria-label={isProduction ? `Choose ${currentRound.type} output` : `Choose ${role} stems`} type="file" multiple={!isProduction} disabled={disabled} accept="audio/*,.wav,.aiff,.aif,.flac,.m4a" onChange={event => { setFiles(Array.from(event.target.files || [])); setAi(false); setError(''); }} className="mt-2 block w-full min-w-0 max-w-full rounded border bg-white p-2 text-sm font-normal" />
        </label>
        {!!files.length && <p className="mt-2 break-words text-xs text-gray-600">Ready to upload: {files.map(file => file.name).join(', ')}</p>}
        {!isProduction && !!files.length && <OriginalsAiDeclaration checked={ai} onChange={setAi} disabled={disabled} multiple={files.length > 1} />}
        <button type="button" disabled={disabled || !files.length} onClick={upload} className="mt-3 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{working === 'upload' ? 'Uploading…' : files.length > 1 ? 'Upload stems' : isProduction ? 'Upload output' : 'Upload stem'}</button>
      </div>
      {!!available.length && <div className="mt-4">
        <h3 className="text-sm font-semibold">{isProduction ? 'Your uploaded output' : 'Your stems'}</h3>
        {!isProduction && <p className="mt-1 text-xs text-gray-600">Include up to four files — for example, two ideas with a clean and effects version of each. Mark each as with or without effects; either version can be submitted on its own.</p>}
        <div role="table" aria-label="Your uploaded recordings" className="mt-3 overflow-hidden rounded-lg border">
          {!isProduction && <div role="row" className="hidden grid-cols-[minmax(0,1fr)_14rem_8rem] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-600 sm:grid"><span role="columnheader">File</span><span role="columnheader">Effects?</span><span role="columnheader">Actions</span></div>}
          {available.map(asset => {
            const assetId = idOf(asset._id), included = selected.includes(assetId), reviewed = Boolean(asset.alignmentReview?.reviewedAt);
            return <div role="row" key={assetId} className={`grid min-w-0 gap-3 border-t p-3 first:border-t-0 ${isProduction ? '' : 'sm:grid-cols-[minmax(0,1fr)_14rem_8rem] sm:items-center'}`}>
              <div role="cell" className="min-w-0"><label className="flex items-start gap-2 text-sm"><input type={isProduction ? 'radio' : 'checkbox'} name="output-to-submit" aria-label={`Include ${asset.originalName}`} checked={included} disabled={disabled || (!included && !isProduction && selected.length >= 4)} onChange={event => toggle(assetId, event.target.checked)} className="mt-1 shrink-0" /><span className="min-w-0 break-words">{asset.originalName}{submittedIds.has(assetId) && <span className="mt-1 block text-xs text-gray-500">Previously submitted — uncheck to leave out of this revision.</span>}</span></label></div>
              {!isProduction && <div role="cell"><fieldset className="min-w-0"><legend className="sr-only">Effects for {asset.originalName}</legend><div className="inline-flex flex-wrap rounded border text-xs">{[['without_effects', 'Without effects'], ['with_effects', 'With effects']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-1.5 px-2 py-2 ${((effects[assetId] || 'without_effects') === value) ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}><input type="radio" name={`effects-${assetId}`} value={value} checked={(effects[assetId] || 'without_effects') === value} disabled={disabled} onChange={() => setEffects(current => ({ ...current, [assetId]: value }))} aria-label={`${label}: ${asset.originalName}`} />{label}</label>)}</div></fieldset></div>}
              <div role="cell" className="flex flex-col items-start gap-2">{isProduction ? <details className="text-sm"><summary className="cursor-pointer underline">Listen to your output</summary><EmbeddedReference token={token} asset={asset} hideName /></details> : <button type="button" disabled={disabled} onClick={() => onReviewAssets([assetId])} className={`text-left text-xs font-medium underline ${reviewed ? 'text-emerald-700' : 'text-slate-700'}`}>{reviewed ? 'Alignment checked ✓' : 'Check alignment'}</button>}{(!submitted || editing) && !submittedIds.has(assetId) && <button type="button" aria-label={`Delete ${asset.originalName}`} disabled={disabled} onClick={() => deleteUpload(assetId)} className="min-h-9 text-xs font-medium text-red-700 underline disabled:opacity-40">{working === `delete:${assetId}` ? 'Deleting…' : 'Delete'}</button>}</div>
            </div>;
          })}
        </div>
      </div>}
      {!isProduction && <fieldset className="mt-4 rounded-lg border p-3 text-sm"><legend className="px-1 font-semibold">Royalties if your take is accepted</legend><p className="text-xs text-gray-600">Master royalties are included for accepted recordings. <SectionLink to="project-royalties">View the royalty split</SectionLink>.</p><label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={songwriting} disabled={disabled} onChange={event => setSongwriting(event.target.checked)} className="mt-1" /><span>Also request songwriting credit</span></label></fieldset>}
      <label className="mt-4 block text-sm font-medium">Notes for the project owner (optional)<textarea value={notes} disabled={disabled} onChange={event => setNotes(event.target.value)} className="mt-1 w-full rounded border px-3 py-2 font-normal" rows={2} /></label>
      <p id="take-submission-status" role="status" className="mt-3 text-sm text-gray-600">{isProduction ? productionReady ? 'Your output is ready to submit.' : 'Upload your finished output to continue.' : stemSubmission.message || (pendingAlignment.length ? `Check alignment for ${pendingAlignment.length} stem${pendingAlignment.length === 1 ? '' : 's'} before submitting.` : `${selected.length} stem${selected.length === 1 ? '' : 's'} included. Ready to send for review.`)}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <button type="button" aria-describedby="take-submission-status" disabled={disabled || (isProduction ? !productionReady : !stemSubmission.ready)} onClick={submit} className="mt-3 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{working === 'submit' ? 'Submitting…' : isProduction ? `Submit ${currentRound.type} for review` : editing ? 'Submit revised take for review' : 'Submit take for review'}</button>
      {!editing && <p className="mt-3 text-xs text-gray-600">Need longer? <SectionLink to="project-extensions">Request an extension</SectionLink> before your reservation expires.</p>}
    </>}
    {!reservation && <p role={submitted ? 'status' : undefined} className={`mt-3 rounded p-3 text-sm ${submitted ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-gray-600'}`}>{submitted ? `Your ${submitted.roleName} recording has been submitted for review. We’ll email you a confirmation.` : 'Reserve a place in the current round to upload and submit your recording. Future places activate when their round opens.'}</p>}
    {canManage && <ReferenceUpload token={token} projectId={project._id} roundId={currentRound?._id} disabled={disabled} onBusyChange={onBusyChange} onRefresh={onRefresh} />}
    {!!otherFiles.length && <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Project files{reservation ? ' & earlier uploads' : ''}</summary><OriginalsFilesPlayback token={token} assets={otherFiles} submissions={submissions} viewerId={viewerId} canManage={canManage} /></details>}
  </section>;
}
