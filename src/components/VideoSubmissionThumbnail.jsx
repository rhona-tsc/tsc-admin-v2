import React, { useEffect, useId, useState } from "react";
import { backendUrl } from "../App";

const savedToken = () => ["token", "adminToken", "musicianToken"].map(key => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
const pathFor = (musicianId, item) => `${backendUrl}/api/musician/${musicianId}/video-submissions/${item._id}/thumbnail`;

export function VideoSubmissionThumbnail({ musicianId, item, token = savedToken(), className = "w-full" }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!musicianId || !item?._id || !token) return;
    const controller = new AbortController();
    let imageUrl = "";
    setUrl("");
    setFailed(false);
    fetch(pathFor(musicianId, item), { headers: { Authorization: `Bearer ${token}`, token }, credentials: "include", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Preview unavailable"); return response.blob(); })
      .then(blob => { if (!controller.signal.aborted) { imageUrl = URL.createObjectURL(blob); setUrl(imageUrl); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [musicianId, item?._id, item?.thumbnailUpdatedAt, token]);
  return <div className={`aspect-video overflow-hidden rounded-lg bg-slate-100 ${className}`}>
    {url && !failed ? <img src={url} alt={`Thumbnail for ${item.suppliedTitle || "submitted video"}`} onError={() => setFailed(true)} className="h-full w-full object-cover" />
      : <div className="flex h-full min-h-20 items-center justify-center px-3 text-center text-xs text-gray-500">{failed ? "Preview temporarily unavailable" : "Preparing thumbnail…"}</div>}
  </div>;
}

export function VideoThumbnailUpload({ musicianId, item, onChanged }) {
  const id = useId();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const upload = async () => {
    if (!file || busy) return;
    if (file.size > 5 * 1024 * 1024) { setMessage("Choose an image up to 5 MB."); return; }
    setBusy(true);
    setMessage("");
    try {
      const token = savedToken();
      const body = new FormData();
      body.append("thumbnail", file);
      const response = await fetch(pathFor(musicianId, item), { method: "POST", headers: { Authorization: `Bearer ${token}`, token }, body, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Thumbnail upload failed");
      setFile(null);
      setMessage("✓ Thumbnail saved for TSC review.");
      onChanged?.(data.submission);
      window.dispatchEvent(new CustomEvent("musician-video-library-updated"));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <details className="mt-3 border-t border-gray-100 pt-2">
    <summary className="cursor-pointer font-medium text-gray-700">{item.thumbnailSource === "custom" ? "Replace thumbnail" : "Upload your own thumbnail (optional)"}</summary>
    <p className="mt-2 text-xs text-gray-600">No text, names, logos, social handles or other branding. JPG, PNG or WebP, up to 5 MB. A landscape image works best.</p>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="sr-only">Thumbnail for {item.suppliedTitle || item.originalName}</label>
      <input id={id} key={item.thumbnailUpdatedAt || "initial"} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={event => { setFile(event.target.files?.[0] || null); setMessage(""); }} className="min-w-0 max-w-full rounded border bg-white p-2 text-xs" />
      <button type="button" disabled={!file || busy || item.status === "publishing"} onClick={upload} className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">{busy ? "Saving…" : "Upload thumbnail"}</button>
    </div>
    {message ? <p role="status" className={`mt-2 text-xs ${message.startsWith("✓") ? "text-green-700" : "text-red-700"}`}>{message}</p> : null}
  </details>;
}

export function VideoThumbnailReview({ musicianId, item, token = savedToken(), onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (item.thumbnailSource !== "custom") return null;
  const review = async (decision) => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`${pathFor(musicianId, item)}/review`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, token, "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ decision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not review thumbnail");
      onChanged?.(data.submission);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="mt-2 text-xs">
    <p>Custom thumbnail: {item.thumbnailReviewStatus || "pending"}. Check that it contains no text or branding.</p>
    {item.thumbnailReviewStatus !== "approved" ? <button type="button" disabled={busy} onClick={() => review("approve")} className="mr-2 mt-2 rounded border border-green-700 px-2 py-1 text-green-800 disabled:opacity-40">Approve thumbnail</button> : null}
    {item.thumbnailReviewStatus !== "rejected" ? <button type="button" disabled={busy} onClick={() => review("reject")} className="mt-2 rounded border px-2 py-1 text-red-700 disabled:opacity-40">Reject thumbnail</button> : null}
    {error ? <p role="alert" className="mt-1 text-red-700">{error}</p> : null}
  </div>;
}
