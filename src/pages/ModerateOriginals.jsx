import { OriginalsAiStatus } from "../components/OriginalsAiDeclaration";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { EmbeddedReference } from "../components/OriginalsProjectListening";
import { originalsRequest } from "../utils/originalsApi";
import { formatOriginalsDeadline } from "../utils/originalsDeadlines";

const sourceLabels = { none: "No starting recording", guide_track: "Guide / sample", video_demo: "Video demo", final_eligible_stem: "Stem intended for the final recording" };
const errorMessage = (error, fallback) => [error?.response?.data?.message || fallback, ...(error?.response?.data?.errors || [])].join(". ");

function ProjectDetails({ token, project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    originalsRequest(token, { method: "get", url: `/projects/${project._id}/workspace` })
      .then(({ data: workspace }) => { if (!cancelled) setData(workspace); })
      .catch(error => { if (!cancelled) setError(errorMessage(error, "Could not load the project files")); });
    return () => { cancelled = true; };
  }, [token, project._id, attempt]);
  return <div className="mt-4 space-y-4">
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="font-semibold">Starting material</dt><dd>{sourceLabels[project.sourceType] || "Not specified"}</dd></div>
      <div><dt className="font-semibold">Tempo, key & time signature</dt><dd>{[project.bpm ? `${project.bpm} BPM` : "Tempo not specified", project.musicalKey || "Key not specified", project.timeSignature || "Time signature not specified"].join(" · ")}</dd></div>
      <div><dt className="font-semibold">Original material declaration</dt><dd>{project.originalWorkConfirmed ? "Owner confirmed this is original material they control" : "Not confirmed"}</dd></div>
      <div><dt className="font-semibold">Owner songwriting request</dt><dd>{project.ownerSongwritingClaim ? "Songwriting contribution requested" : "No songwriting contribution requested"}</dd></div>
      <div><dt className="font-semibold">Owner agreement</dt><dd>{project.ownerAgreement?.accepted ? `Accepted${project.ownerAgreement.acceptedAt ? ` · ${formatOriginalsDeadline(project.ownerAgreement.acceptedAt)}` : ""}` : "Not accepted"}</dd></div>
    </dl>
    <h3 className="font-semibold">Project recordings & voice note</h3>
    {error ? <p role="alert" className="text-sm text-red-700">{error} <button onClick={() => setAttempt(value => value + 1)} className="underline">Try again</button></p> : !data ? <p role="status" className="text-sm text-gray-500">Loading project files…</p> : (data.assets || []).filter(asset => asset.state === 'active').length ? (data.assets || []).filter(asset => asset.state === 'active').map(asset => <div key={asset._id} className="rounded-lg border p-3"><p className="text-sm font-medium">{asset.kind === 'voice_note' ? 'Owner voice note' : String(asset.kind).replaceAll('_', ' ')}</p><OriginalsAiStatus asset={asset} /><EmbeddedReference token={token} asset={asset} showDownload /></div>) : <p className="text-sm text-gray-500">No files uploaded for this project.</p>}
    <Link to={`/originals/${project._id}`} className="inline-block text-sm font-semibold underline">Open full project workspace</Link>
  </div>;
}

const ModerateOriginals = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState({});
  const locks = useRef(new Set());
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState({});
  const [reasons, setReasons] = useState({});
  const [feedback, setFeedback] = useState("");

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true); setLoadError("");
    originalsRequest(token, { method: "get", url: "/moderation" })
      .then(({ data }) => { if (!cancelled) setProjects(data.projects || []); })
      .catch(error => { if (!cancelled) setLoadError(errorMessage(error, "Could not load moderation queue")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);
  useEffect(() => load(), [load]);

  const decide = async (project, decision) => {
    const id = project._id;
    if (locks.current.has(id)) return;
    const reason = (reasons[id] || "").trim();
    if (decision !== "approve" && !reason) { setErrors(value => ({ ...value, [id]: "Please enter a reason for the owner before requesting changes or rejecting." })); return; }
    locks.current.add(id);
    setBusy(value => ({ ...value, [id]: decision }));
    setErrors(value => ({ ...value, [id]: "" })); setFeedback("");
    try {
      const { data } = await originalsRequest(token, { method: "post", url: `/projects/${id}/moderate`, data: { decision, reason } });
      if (!data.success) throw new Error(data.message || "Could not moderate project");
      setProjects(value => value.filter(item => item._id !== id));
      const message = decision === "approve"
        ? data.notification?.failed ? `“${project.title}” approved. Announcement emails are waiting for an automatic delivery retry.` : `“${project.title}” approved. Announcement emails are queued for delivery.`
        : decision === "request_changes" ? `Changes requested for “${project.title}”. It will return here when the owner resubmits.` : `“${project.title}” rejected.`;
      setFeedback(message);
      if (data.notification?.failed) toast.warning(message); else toast.success(message);
    } catch (error) {
      const message = errorMessage(error, error.message || "Could not moderate project");
      setErrors(value => ({ ...value, [id]: message })); toast.error(message);
    } finally {
      locks.current.delete(id);
      setBusy(value => ({ ...value, [id]: "" }));
    }
  };

  return <div className="px-4 py-8 sm:px-6">
    <Title text1="MODERATE" text2="ORIGINALS LISTINGS" />
    <p className="mt-3 text-sm text-gray-600">Review the brief, recordings and declarations before approving. Only projects awaiting a decision appear here.</p>
    {feedback && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">{feedback}</p>}
    {loading && <p role="status" className="mt-8">Loading queue…</p>}
    {loadError && <p role="alert" className="mt-4 text-red-700">{loadError} <button onClick={load} className="underline">Try again</button></p>}
    <div className="mt-6 space-y-4">
      {projects.map(project => <article id={`project-${project._id}`} key={project._id} aria-busy={Boolean(busy[project._id])} className="scroll-mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{project.title}</h2><p className="mt-1 break-words text-xs text-gray-500">{project.ownerName} · {project.ownerEmail}</p><p className="mt-1 text-xs text-gray-500">Submitted {formatOriginalsDeadline(project.moderation?.submittedAt) || "date unavailable"}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Pending moderation</span></div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-700">{project.description}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Genres</dt><dd>{(project.genres || []).join(", ")}</dd></div><div><dt className="font-semibold">Roles in round order</dt><dd>{(project.requestedRoles || []).map(role => `${role.name}${role.foundationEligible ? " (foundation)" : ""}`).join(", ")}</dd></div></dl>
        <details className="mt-4 rounded-lg border p-4" onToggle={event => { const open = event.currentTarget.open; setExpanded(value => ({ ...value, [project._id]: open })); }}>
          <summary className="cursor-pointer text-sm font-semibold">Project details & recordings</summary>
          {expanded[project._id] && <ProjectDetails token={token} project={project} />}
        </details>
        <label className="mt-4 block text-sm">Reason for requesting changes or rejecting<textarea value={reasons[project._id] || ""} disabled={Boolean(busy[project._id])} onChange={event => setReasons(value => ({ ...value, [project._id]: event.target.value }))} rows={2} className="mt-1 block w-full rounded border px-3 py-2" /></label>
        {errors[project._id] && <p role="alert" className="mt-3 text-sm text-red-700">{errors[project._id]}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {[['approve', 'Approve', 'Approving…', 'bg-green-700'], ['request_changes', 'Request changes', 'Requesting changes…', 'bg-amber-600'], ['reject', 'Reject', 'Rejecting…', 'bg-red-700']].map(([decision, label, pendingLabel, color]) => <button key={decision} disabled={Boolean(busy[project._id])} onClick={() => decide(project, decision)} className={`rounded ${color} px-4 py-2 text-sm font-semibold text-white active:scale-95 disabled:cursor-wait disabled:opacity-50`}>{busy[project._id] === decision ? pendingLabel : label}</button>)}
        </div>
      </article>)}
      {!loading && !loadError && !projects.length && <div className="rounded border bg-white p-8 text-center text-gray-500">No Originals projects are awaiting moderation.</div>}
    </div>
  </div>;
};

export default ModerateOriginals;
