import OriginalsAiDeclaration from "../components/OriginalsAiDeclaration";
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

const emptyRole = () => ({ name: "", foundationEligible: false });

const ListOriginalProject = ({ token }) => {
  const navigate = useNavigate();
  const { agreement: ownerAgreement, error: ownerAgreementError, reload: reloadOwnerAgreement } = useOriginalsOwnerAgreement(token);
  const [saving, setSaving] = useState(false);
  const [initialFile, setInitialFile] = useState(null);
  const [initialCreatedEntirelyWithAi, setInitialCreatedEntirelyWithAi] = useState(false);
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
    if (!validRoles.length) return toast.error("Add at least one instrument or role");
    if (["none", "video_demo"].includes(form.sourceType) && !validRoles.some((role) => role.foundationEligible)) {
      return toast.error("Choose at least one role that can start the foundation");
    }
    if (form.sourceType !== "none" && !initialFile) return toast.error("Choose the starting reference file");

    try {
      setSaving(true);
      const payload = {
        ...form,
        bpm: form.bpm ? Number(form.bpm) : null,
        genres: form.genres.split(",").map((item) => item.trim()).filter(Boolean),
        requestedRoles: validRoles,
        ownerAgreement: { version: ownerAgreement.version, textHash: ownerAgreement.textHash, acknowledgement: ownerAgreement.acknowledgement },
      };
      const created = await originalsRequest(token, {
        method: "post",
        url: "/projects",
        data: payload,
      });
      if (initialFile) {
        const upload = new FormData();
        upload.append("file", initialFile);
        upload.append("kind", form.sourceType === "guide_track" ? "guide_track" : form.sourceType === "video_demo" ? "video_submission" : "initial_stem");
        upload.append("songwritingClaim", String(form.ownerSongwritingClaim));
        if (form.sourceType === "final_eligible_stem") upload.append("createdEntirelyWithAi", String(initialCreatedEntirelyWithAi));
        await originalsRequest(token, {
          method: "post",
          url: `/projects/${created.data.project._id}/assets`,
          data: upload,
        });
      }
      if (voiceNote) {
        const voiceUpload = new FormData();
        voiceUpload.append("file", voiceNote);
        voiceUpload.append("kind", "voice_note");
        await originalsRequest(token, { method: "post", url: `/projects/${created.data.project._id}/assets`, data: voiceUpload });
      }
      await originalsRequest(token, {
        method: "post",
        url: `/projects/${created.data.project._id}/submit-for-moderation`,
      });
      toast.success("Originals project submitted for moderation");
      navigate("/originals/mine");
    } catch (error) {
      if (error.response?.data?.code === 'ORIGINALS_AGREEMENT_REQUIRED') reloadOwnerAgreement();
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
            <button type="button" onClick={() => setField("requestedRoles", [...form.requestedRoles, emptyRole()])} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">+ Add role</button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Their order is the preferred sequential round order. Mixing and mastering are already included as separate final stages below.
          </p>
          <div className="mt-3 space-y-2">
            {form.requestedRoles.map((role, index) => (
              <div key={index} className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
                <input value={role.name} onChange={(e) => setRole(index, { name: e.target.value })} placeholder="Guitar, vocals, mix producer…" className="flex-1 rounded border px-3 py-2" />
                {["none", "video_demo"].includes(form.sourceType) ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={role.foundationEligible} onChange={(e) => setRole(index, { foundationEligible: e.target.checked })} />
                    Can start foundation
                  </label>
                ) : null}
                {form.requestedRoles.length > 1 ? (
                  <button type="button" onClick={() => setField("requestedRoles", form.requestedRoles.filter((_, roleIndex) => roleIndex !== index))} className="text-sm text-red-600">Remove</button>
                ) : null}
              </div>
            ))}
          </div>

          <section aria-live="polite" className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <OriginalsMasterRoyaltySplit title="Projected share of the remaining master royalties" shares={plannedMasterShares(validRoles)} roles={validRoles} columns={2} />
            <p className="mt-3 text-xs text-gray-600">This projected split updates as roles are added. Accepted contributor roles share 50% of the remaining pool equally. The final split depends on accepted contributions, the selected mix and the selected master.</p>
            {!validRoles.length && <p className="mt-2 text-xs text-gray-500">Add a role to see how the contributor pool will be divided.</p>}
          </section>
        </section>

        <label className="block text-sm font-medium text-gray-700">Starting material
          <select disabled={saving} value={form.sourceType} onChange={(e) => { const sourceType = e.target.value; setForm((current) => ({ ...current, sourceType, hasInitialStem: ["final_eligible_stem", "guide_track"].includes(sourceType), ownerSongwritingClaim: sourceType !== "none" })); setInitialFile(null); setInitialCreatedEntirelyWithAi(false); }} className="mt-2 w-full rounded border px-3 py-2"><option value="none">No starting file — musicians create the foundation</option><option value="final_eligible_stem">Original stem intended for the final track</option><option value="guide_track">Guide track — reference only, remove from final production</option><option value="video_demo">Video demo/reference</option></select>
        </label>
        {form.sourceType !== "none" ? (
          <div className="block rounded border border-dashed bg-gray-50 p-4 text-sm text-gray-700">
            Private starting reference (audio, or MP4/MOV for a video demo; maximum 100 MB)
            <input key={form.sourceType} required type="file" accept={form.sourceType === "video_demo" ? "video/mp4,video/quicktime,.mp4,.mov" : "audio/*,.wav,.aiff,.flac,.m4a"} disabled={saving} aria-label="Starting reference file" onChange={(event) => { setInitialFile(event.target.files?.[0] || null); setInitialCreatedEntirelyWithAi(false); }} className="mt-2 block w-full" />
            {form.sourceType === "final_eligible_stem" && <OriginalsAiDeclaration checked={initialCreatedEntirelyWithAi} onChange={setInitialCreatedEntirelyWithAi} disabled={saving || !initialFile} />}
            <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={form.ownerSongwritingClaim} onChange={(e) => setField("ownerSongwritingClaim", e.target.checked)} />I am claiming songwriting credit for the composition demonstrated in this {form.sourceType === "video_demo" ? "video" : form.sourceType === "guide_track" ? "guide track" : "stem"}.</label>
            {form.sourceType === "guide_track" ? <p className="mt-2 text-xs text-amber-700">This file will remain available as a private reference but is marked ineligible for the final production.</p> : null}
          </div>
        ) : (
          <div className="rounded border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
            Without a starting stem, up to three musicians can compete to create the foundation.
          </div>
        )}
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

        <button disabled={saving || recordingVoiceNote || !ownerAgreement} className="w-full rounded bg-black px-5 py-3 font-semibold text-white hover:bg-[#ff6667] disabled:opacity-50">
          {saving ? "Submitting…" : "Submit for moderation"}
        </button>
      </form>
    </div>
  );
};

export default ListOriginalProject;
