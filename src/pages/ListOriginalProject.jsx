import { recordingOrderError } from '../utils/originalsRecordingOrder';
import OriginalsStartingFiles from "../components/OriginalsStartingFiles";
import { originalStartingMaterial, originalStartingFilesError, submitOriginalStartingProject } from "../utils/originalsStartingFiles";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import OriginalsAgreementText from "../components/OriginalsAgreementText";
import useOriginalsOwnerAgreement from "../hooks/useOriginalsOwnerAgreement";
import OriginalsVoiceNoteRecorder from "../components/OriginalsVoiceNoteRecorder";
import OriginalsMasterRoyaltySplit from "../components/OriginalsMasterRoyaltySplit";
import { plannedMasterShares } from "../utils/originalsRoyalties";
import { originalsRequest } from "../utils/originalsApi";
import OriginalsMusicianBrowser from '../components/OriginalsMusicianBrowser';

const emptyRole = () => ({ name: "", foundationEligible: false, recordingOrder: "" });

const ListOriginalProject = ({ token }) => {
  const navigate = useNavigate();
  const { agreement: ownerAgreement, error: ownerAgreementError, reload: reloadOwnerAgreement } = useOriginalsOwnerAgreement(token);
  const [saving, setSaving] = useState(false);
  const [choosingMusicianFor, setChoosingMusicianFor] = useState(null);
  const [startingFiles, setStartingFiles] = useState([]);
  const startingMaterial = originalStartingMaterial(startingFiles);
  const uploadProgress = useRef({});
  const [draftProjectId, setDraftProjectId] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [initialFinalConfirmed, setInitialFinalConfirmed] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const [recordingVoiceNote, setRecordingVoiceNote] = useState(false);
  const recordingVoiceNoteRef = useRef(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genres: "",
    requestedRoles: [emptyRole()],
    hasInitialStem: false,
    sourceType: "none",
    ownerSongwritingClaim: false,
    ownerAnonymous: false,
    ownerCreditName: "",
    bpm: "",
    musicalKey: "",
    timeSignature: "",
    originalWorkConfirmed: false,
    ownerAgreementAccepted: false,
    ownerAgreementDisplayName: "",
  });

  useEffect(() => {
    setForm(current => current.ownerAgreementAccepted ? { ...current, ownerAgreementAccepted: false } : current);
  }, [ownerAgreement?.textHash]);

  const validRoles = useMemo(
    () => form.requestedRoles.filter((role) => role.name.trim()),
    [form.requestedRoles],
  );

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setRole = (index, changes) =>
    setForm((current) => ({
      ...current,
      requestedRoles: current.requestedRoles.map((role, roleIndex) =>
        roleIndex === index ? { ...role, ...changes } : role,
      ),
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (recordingVoiceNoteRef.current) return toast.error("Stop or cancel the voice recording before submitting the project.");
    if (!ownerAgreement) return toast.error("Load and read the owner agreement before submitting the project.");
    if (!form.ownerAgreementAccepted || !form.ownerAgreementDisplayName.trim()) return toast.error("Accept the owner agreement and enter your full name.");
    if (recordingOrderError(validRoles)) return toast.error(recordingOrderError(validRoles));
    if (!validRoles.length) return toast.error("Add at least one instrument or role");
    if (["none", "video_demo"].includes(startingMaterial.sourceType) && !validRoles.some((role) => role.foundationEligible)) {
      return toast.error("Choose at least one role that can start the foundation");
    }
    const fileError = originalStartingFilesError(startingFiles, initialFinalConfirmed);
    if (fileError) return toast.error(fileError);

    try {
      setSaving(true);
      const payload = {
        ...form,
        ...startingMaterial,
        bpm: form.bpm ? Number(form.bpm) : null,
        genres: form.genres.split(",").map((item) => item.trim()).filter(Boolean),
        requestedRoles: validRoles,
        preferredMusicians: validRoles.filter(role => role.preferredMusicianId).map(role => ({ roleName: role.name, musicianId: role.preferredMusicianId })),
        ownerAgreement: { version: ownerAgreement.version, textHash: ownerAgreement.textHash, acknowledgement: ownerAgreement.acknowledgement },
      };
      await submitOriginalStartingProject({
        request: config => originalsRequest(token, config), payload, files: startingFiles, voiceNote,
        progress: uploadProgress.current,
        onProgress: ({ projectId, message }) => { setDraftProjectId(projectId); setUploadStatus(message); },
      });
      toast.success("Originals project submitted for moderation");
      navigate("/originals/mine");
    } catch (error) {
      if (error.response?.data?.code === 'ORIGINALS_AGREEMENT_REQUIRED') reloadOwnerAgreement();
      if (uploadProgress.current.projectId) setUploadStatus("Your draft and uploaded files are saved. Retry to finish the remaining uploads and submit this same project.");
      const details = error?.response?.data?.errors;
      toast.error(details?.join(". ") || error?.response?.data?.message || "Could not submit project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Title text1="LIST AN" text2="ORIGINALS PROJECT" />
      <p className="mt-3 text-sm text-gray-600">
        Start an original collaboration. Listings are reviewed by TSC before musicians are notified.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-800">
          Project title
          <input required maxLength={160} value={form.title} onChange={(e) => setField("title", e.target.value)} className="mt-2 w-full rounded border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium text-gray-800">
          Feel, vibe and intended final result
          <textarea required rows={7} maxLength={5000} value={form.description} onChange={(e) => setField("description", e.target.value)} className="mt-2 w-full rounded border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium text-gray-800">
          Genres (comma separated)
          <input required value={form.genres} onChange={(e) => setField("genres", e.target.value)} placeholder="Soul, Pop, Neo-soul" className="mt-2 w-full rounded border px-3 py-2" />
        </label>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Requested instruments and roles</h2>
            <button type="button" disabled={saving || Boolean(draftProjectId)} onClick={() => setField("requestedRoles", [...form.requestedRoles, emptyRole()])} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">+ Add role</button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Optionally number roles in your preferred recording order (1–30). Leave blank if undecided. We will suggest your next numbered role after each approval; you can change it then. TSC can follow this plan if a review is overdue. Mixing and mastering follow as separate final stages.
          </p>
          <div className="mt-3 space-y-2">
            {form.requestedRoles.map((role, index) => (
              <div key={index} className="space-y-3 rounded border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                <input disabled={saving || Boolean(draftProjectId)} value={role.name} onChange={(e) => setRole(index, { name: e.target.value })} placeholder="Guitar, vocals, click track…" className="flex-1 rounded border px-3 py-2" />
                <label className="shrink-0 text-xs font-medium">Recording order (optional)<input aria-label={`Recording order for role ${index + 1}`} type="number" min="1" max="30" step="1" value={role.recordingOrder ?? ''} onChange={event => setRole(index, { recordingOrder: event.target.value })} className="mt-1 block w-24 rounded border p-2" placeholder="—" /></label>
                {["none", "video_demo"].includes(startingMaterial.sourceType) ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={role.foundationEligible} onChange={(e) => setRole(index, { foundationEligible: e.target.checked })} />
                    Can start foundation
                  </label>
                ) : null}
                {form.requestedRoles.length > 1 ? (
                  <button type="button" disabled={saving || Boolean(draftProjectId)} onClick={() => { setField("requestedRoles", form.requestedRoles.filter((_, roleIndex) => roleIndex !== index)); setChoosingMusicianFor(null); }} className="text-sm text-red-600">Remove</button>
                ) : null}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Preferred musician (optional): </span>{role.preferredDisplayName || 'No place held'}
                  <button type="button" disabled={saving || Boolean(draftProjectId) || !role.name.trim()} onClick={() => setChoosingMusicianFor(choosingMusicianFor === index ? null : index)} className="ml-2 underline">{choosingMusicianFor === index ? 'Close chooser' : role.preferredMusicianId ? 'Change musician' : 'Choose musician'}</button>
                  {role.preferredMusicianId && <button type="button" disabled={saving || Boolean(draftProjectId)} onClick={() => setRole(index, { preferredMusicianId: '', preferredDisplayName: '' })} className="ml-2 underline">Clear</button>}
                </div>
                {choosingMusicianFor === index && <OriginalsMusicianBrowser token={token} creatingProject initialInstrument={role.name} selectedId={role.preferredMusicianId} disabled={saving || Boolean(draftProjectId)} onSelect={(id, musician) => { if (id) { setRole(index, { preferredMusicianId: id, preferredDisplayName: musician.displayName }); setChoosingMusicianFor(null); } }} />}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600">A preferred musician gets one of the three places held for them. They accept their own agreement; no countdown starts until their round opens and the place activates. Other places remain available.</p>

          <section aria-live="polite" className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <OriginalsMasterRoyaltySplit title="Projected share of the remaining master royalties" shares={plannedMasterShares(validRoles)} roles={validRoles} columns={2} />
            <p className="mt-3 text-xs text-gray-600">This projected split updates as roles are added. Accepted contributor roles share 50% of the remaining pool equally. The final split depends on accepted contributions, the selected mix and the selected master.</p>
            {!validRoles.length && <p className="mt-2 text-xs text-gray-500">Add a role to see how the contributor pool will be divided.</p>}
          </section>
        </section>

        <OriginalsStartingFiles files={startingFiles} onChange={setStartingFiles} disabled={saving} uploaded={uploadProgress.current.uploaded} finalConfirmed={initialFinalConfirmed} onFinalConfirmed={setInitialFinalConfirmed} />
        {!!startingFiles.length && <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={saving} checked={form.ownerSongwritingClaim} onChange={event => setField('ownerSongwritingClaim', event.target.checked)} />I am claiming songwriting credit for the composition demonstrated in the starting material.</label>}
        <OriginalsVoiceNoteRecorder value={voiceNote} onChange={setVoiceNote} disabled={saving} onRecordingChange={recording => { recordingVoiceNoteRef.current = recording; setRecordingVoiceNote(recording); }} />

        <div className="grid gap-3 sm:grid-cols-3">
          <input type="number" min="1" max="400" value={form.bpm} onChange={(e) => setField("bpm", e.target.value)} placeholder="BPM (optional)" className="rounded border px-3 py-2" />
          <input value={form.musicalKey} onChange={(e) => setField("musicalKey", e.target.value)} placeholder="Key (optional)" className="rounded border px-3 py-2" />
          <input value={form.timeSignature} onChange={(e) => setField("timeSignature", e.target.value)} placeholder="Time signature" className="rounded border px-3 py-2" />
        </div>

        <section className="rounded border p-4">
          <label className="flex items-start gap-2 text-sm">
            <input className="mt-1" type="checkbox" checked={form.ownerAnonymous} onChange={(e) => setField("ownerAnonymous", e.target.checked)} />
            List this project anonymously. TSC will retain my verified identity privately.
          </label>
          {form.ownerAnonymous ? (
            <input required value={form.ownerCreditName} onChange={(e) => setField("ownerCreditName", e.target.value)} placeholder="Artistic/credit name" className="mt-3 w-full rounded border px-3 py-2" />
          ) : null}
        </section>

        <section id="owner-agreement" className="space-y-4 rounded-xl border bg-white p-4 text-sm sm:p-5" aria-labelledby="owner-agreement-title">
          <h2 id="owner-agreement-title" className="text-lg font-semibold">Project owner agreement</h2>
          <p className="text-slate-600">Read the full terms below, then enter your name and confirm before submitting your project.</p>
          {ownerAgreement && <OriginalsAgreementText agreement={ownerAgreement} />}
          {!ownerAgreement && !ownerAgreementError && <p role="status">Loading agreement…</p>}
          {ownerAgreementError && <div className="space-y-2"><p role="alert" className="text-red-700">{ownerAgreementError}</p><button type="button" onClick={reloadOwnerAgreement} className="rounded border px-3 py-2">Reload agreement</button></div>}
          <label className="flex items-start gap-2 border-t pt-4">
            <input required disabled={saving || !ownerAgreement} className="mt-1" type="checkbox" checked={form.originalWorkConfirmed} onChange={(e) => setField("originalWorkConfirmed", e.target.checked)} />
            I confirm this is original material, not a cover, and I will not upload material I do not control.
          </label>
          <label className="block font-medium">Your full name
            <input required autoComplete="name" maxLength={160} disabled={saving || !ownerAgreement} value={form.ownerAgreementDisplayName} onChange={(e) => setField("ownerAgreementDisplayName", e.target.value)} placeholder="Type your full name as acknowledgement" className="mt-1 w-full rounded border bg-white px-3 py-2 font-normal" />
          </label>
          <p className="text-xs text-slate-600">Your name and acceptance are linked to your signed-in account and kept privately with the exact agreement accepted. They do not replace your public credit name.</p>
          <label className="flex items-start gap-3">
            <input required disabled={saving || !ownerAgreement} className="mt-1" type="checkbox" checked={form.ownerAgreementAccepted} onChange={(e) => setField("ownerAgreementAccepted", e.target.checked)} />
            <span>{ownerAgreement?.acknowledgement || 'I have read and agree to the project owner agreement.'}</span>
          </label>
          <a href="/originals/owner-agreement" target="_blank" rel="noopener noreferrer" className="inline-block text-xs underline">Open a printable copy in a new tab</a>
        </section>

        {uploadStatus && <p role="status" className="rounded bg-slate-50 p-3 text-sm">{uploadStatus}</p>}
        <button disabled={saving || recordingVoiceNote || !ownerAgreement} className="w-full rounded bg-black px-5 py-3 font-semibold text-white hover:bg-[#ff6667] disabled:opacity-50">
          {saving ? "Uploading & submitting…" : draftProjectId ? "Retry & submit this project" : "Submit for moderation"}
        </button>
      </form>
    </div>
  );
};

export default ListOriginalProject;
