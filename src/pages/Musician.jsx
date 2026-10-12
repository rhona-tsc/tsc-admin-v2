import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://thesupremecollective.co.uk"
).replace(/\/+$/, "");

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const normaliseImage = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.url === "string") return value.url;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = normaliseImage(item);
      if (found) return found;
    }
  }
  return "";
};

const getProfileImage = (musician) =>
  normaliseImage(musician?.profilePhoto) ||
  normaliseImage(musician?.coverHeroImage) ||
  normaliseImage(musician?.digitalWardrobeBlackTie) ||
  normaliseImage(musician?.digitalWardrobeFormal) ||
  normaliseImage(musician?.digitalWardrobeSmartCasual) ||
  normaliseImage(musician?.digitalWardrobeSessionAllBlack) ||
  normaliseImage(musician?.additionalImages) ||
  "";

const getFullName = (musician) => {
  const first = musician?.basicInfo?.firstName || musician?.firstName || "";
  const last = musician?.basicInfo?.lastName || musician?.lastName || "";
  return `${first} ${last}`.trim() || musician?.name || "Musician";
};

const getPublicProfileUrl = (musician) => {
  const slug = String(musician?.musicianSlug || "").trim();
  if (slug) return `${PUBLIC_SITE_URL}/musician/${slug}`;
  const id = String(musician?._id || musician?.musicianId || "").trim();
  return id ? `${PUBLIC_SITE_URL}/musician/${id}` : "";
};

const sectionCardClass = "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm";
const sectionTitleClass = "text-lg font-semibold text-gray-900 mb-3";

const FormattedBio = ({ value, fallback = "No biography added yet." }) => {
  const text = String(value || fallback)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  const renderBold = (paragraph) =>
    paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={index}>{part.slice(2, -2)}</strong>
        : <React.Fragment key={index}>{part}</React.Fragment>
    );

  let paragraphs = text.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length === 1 && text.length >= 420) {
    const sentences = text.match(/[^.!?]+[.!?]+(?:["”’']+)?|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) || [text];
    if (sentences.length >= 4) {
      paragraphs = [];
      let cursor = 0;
      const paragraphCount = Math.min(3, sentences.length);
      for (let index = 0; index < paragraphCount; index += 1) {
        const remaining = sentences.length - cursor;
        const take = Math.ceil(remaining / (paragraphCount - index));
        paragraphs.push(sentences.slice(cursor, cursor + take).join(" "));
        cursor += take;
      }
    }
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{renderBold(paragraph)}</p>
      ))}
    </div>
  );
};

const InfoList = ({ items = [] }) => {
  const visible = items.filter(
    (item) =>
      item &&
      item.value !== undefined &&
      item.value !== null &&
      String(item.value).trim() !== ""
  );

  if (!visible.length) return <p className="text-gray-500">No details added yet.</p>;

  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {visible.map((item) => (
        <div key={item.label}>
          <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
          <dd className="text-sm text-gray-800 mt-1 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const BulletList = ({ title, items = [] }) => {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        {visible.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const MediaScroller = ({ title, items = [] }) => {
  const urls = (Array.isArray(items) ? items : [])
    .map((item) => normaliseImage(item))
    .filter(Boolean);

  if (!urls.length) return null;

  return (
    <div className="mb-6 last:mb-0">
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {urls.map((url, index) => (
          <div
            key={`${title}-${index}`}
            className="w-[260px] h-[180px] bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200"
          >
            <img
              src={url}
              alt={`${title} ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoList = ({ title, items = [] }) => {
  const visible = (Array.isArray(items) ? items : []).filter((item) => item?.url);
  if (!visible.length) return null;

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <ul className="space-y-2">
        {visible.map((item, index) => (
          <li key={`${title}-${index}`}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#ff6667] hover:underline break-all"
            >
              {item.title || item.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const getVideoEmbedUrl = (value = "") => {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.replace(/^\//, "")}`;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }
  return "";
};

const isDirectVideoUrl = (value = "") => /\.(mp4|mov|m4v|webm)(?:$|[?#])/i.test(value);

const ReviewVideoGrid = ({ groups = [], onApprove, onRequest, busyKey = "" }) => {
  const videos = groups.flatMap(({ label, category, pending, items }) =>
    (Array.isArray(items) ? items : [])
      .filter((item) => item?.url)
      .map((item) => ({ ...item, label, category, pending })),
  );
  if (!videos.length) return <p className="text-sm text-gray-500">No videos supplied.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((video, index) => {
        const embed = getVideoEmbedUrl(video.url);
        const directVideo = isDirectVideoUrl(video.url);
        const playable = Boolean(embed || directVideo);
        const key = `${video.category}-${index}-${video.url}`;
        return (
          <article key={`${video.url}-${index}`} className="overflow-hidden rounded-xl border bg-white">
            {embed ? (
              <iframe
                src={embed}
                title={video.title || `Video ${index + 1}`}
                className="aspect-video w-full bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : directVideo ? (
              <video src={video.url} controls playsInline className="aspect-video w-full bg-black" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-amber-50 p-6 text-center">
                <div>
                  <p className="font-semibold text-amber-900">This is a webpage, not a playable video</p>
                  <a href={video.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-amber-800 underline">
                    {video.url}
                  </a>
                </div>
              </div>
            )}
            <div className="p-3 text-sm">
              <p className="font-medium">{video.title || `Video ${index + 1}`}</p>
              <p className="text-xs text-gray-500">{video.label}</p>
              {video.pending ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {playable ? (
                    <button
                      type="button"
                      disabled={busyKey === key}
                      onClick={() => onApprove?.(video, key)}
                      className="rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyKey === key ? "Approving…" : "Approve video"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyKey === key}
                      onClick={() => onRequest?.(video, key)}
                      className="rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyKey === key ? "Sending…" : "Request proper video link"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};

const DownloadableImage = ({ url, label }) => {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <img src={url} alt={label} className="aspect-[4/3] w-full object-cover" />
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm font-medium">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download
          className="rounded border px-3 py-1 text-xs font-medium hover:bg-gray-50"
        >
          Download original
        </a>
      </div>
    </div>
  );
};

const Musician = () => {
  const navigate = useNavigate();
  const params = useParams();
  const musicianKey = params.musicianId || params.id || params.slug || params.key;
  const [musician, setMusician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [taglineDraft, setTaglineDraft] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [videoActionKey, setVideoActionKey] = useState("");
  const [directVideoSubmissions, setDirectVideoSubmissions] = useState([]);
  const reviewMode = new URLSearchParams(window.location.search).get("review") === "1";

  useEffect(() => {
    let cancelled = false;

    const fetchMusician = async () => {
      if (!musicianKey) {
        setError("No musician ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token") || "";
        const attempts = [
          `${BACKEND_URL}/api/musician/admin/profile/${musicianKey}`
        ].filter(Boolean);

        let found = null;

        for (const url of attempts) {
          try {
            const res = await axios.get(url, {
              headers: token
                ? { Authorization: `Bearer ${token}`, token }
                : {},
            });
            const payload = res?.data;
            const candidate =
              payload?.musician || payload?.deputy || payload?.data || payload;
            if (candidate?._id || candidate?.musicianId) {
              found = candidate;
              break;
            }
          } catch {
            // try next
          }
        }

        if (!found) throw new Error("Musician not found");

        if (!cancelled) {
          setMusician(found);
          setBioDraft(found?.tscApprovedBio || found?.bio || "");
          setTaglineDraft(found?.tagLine || "");
          setLoading(false);
        }

        try {
          const submissionsRes = await axios.get(
            `${BACKEND_URL}/api/musician/${found._id}/video-submissions`,
            { headers: token ? { Authorization: `Bearer ${token}`, token } : {} },
          );
          if (!cancelled) setDirectVideoSubmissions(submissionsRes.data?.submissions || []);
        } catch {
          if (!cancelled) setDirectVideoSubmissions([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load musician profile.");
          setLoading(false);
        }
      }
    };

    fetchMusician();

    return () => {
      cancelled = true;
    };
  }, [musicianKey]);

  const profileImage = useMemo(() => getProfileImage(musician), [musician]);
  const publicProfileUrl = useMemo(() => getPublicProfileUrl(musician), [musician]);
  const fullName = useMemo(() => getFullName(musician), [musician]);

  const token = localStorage.getItem("token") || "";
  const authHeaders = token ? { Authorization: `Bearer ${token}`, token } : {};

  const saveReviewCopy = async () => {
    setSavingReview(true);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/musician/moderation/deputy/${musician._id}/save`,
        { tscApprovedBio: bioDraft, bio: bioDraft, tagLine: taglineDraft },
        { headers: authHeaders },
      );
      setMusician((current) => ({
        ...current,
        ...(res.data?.deputy || res.data?.musician || {}),
        tscApprovedBio: bioDraft,
        bio: bioDraft,
        tagLine: taglineDraft,
      }));
      toast.success("Profile copy saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save profile copy");
    } finally {
      setSavingReview(false);
    }
  };

  const approveVideo = async (video, key) => {
    const pendingField = video.category === "original" ? "originalBandVideoLinks" : "functionBandVideoLinks";
    const approvedField = video.category === "original" ? "tscApprovedOriginalBandVideoLinks" : "tscApprovedFunctionBandVideoLinks";
    const pending = Array.isArray(musician?.[pendingField]) ? musician[pendingField] : [];
    const approved = Array.isArray(musician?.[approvedField]) ? musician[approvedField] : [];
    const nextApproved = approved.some((item) => item?.url === video.url) ? approved : [...approved, { title: video.title || "", url: video.url }];
    const nextPending = pending.filter((item) => item?.url !== video.url);

    setVideoActionKey(key);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/musician/moderation/deputy/${musician._id}/save`,
        { [pendingField]: nextPending, [approvedField]: nextApproved },
        { headers: authHeaders },
      );
      setMusician((current) => ({
        ...current,
        ...(res.data?.deputy || res.data?.musician || {}),
        [pendingField]: nextPending,
        [approvedField]: nextApproved,
      }));
      toast.success("Video approved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not approve video");
    } finally {
      setVideoActionKey("");
    }
  };

  const requestVideoResubmission = async (video, key) => {
    setVideoActionKey(key);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/musician/moderation/deputy/${musician._id}/request-video-resubmission`,
        { category: video.category, url: video.url },
        { headers: authHeaders },
      );
      toast.success(res.data?.message || "Video request sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send video request");
    } finally {
      setVideoActionKey("");
    }
  };

  const refreshDirectVideo = async (submission) => {
    const key = `direct-${submission._id}`;
    setVideoActionKey(key);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/musician/${musician._id}/video-submissions/${submission._id}/refresh`,
        {},
        { headers: authHeaders },
      );
      setDirectVideoSubmissions((items) => items.map((item) => item._id === submission._id ? res.data?.submission || item : item));
      toast.success("Video checks refreshed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not refresh video checks");
    } finally {
      setVideoActionKey("");
    }
  };

  const decideDirectVideo = async (submission, decision) => {
    const key = `direct-${submission._id}`;
    setVideoActionKey(key);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/moderation/video-submissions/${submission._id}/review`,
        { decision, reason: decision === "approve" ? "Final visual check completed" : "Please provide a clean replacement video" },
        { headers: authHeaders },
      );
      setDirectVideoSubmissions((items) => items.map((item) => item._id === submission._id ? res.data?.submission || item : item));
      toast.success(decision === "approve" ? "Video approved and published" : "Replacement requested");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save video decision");
    } finally {
      setVideoActionKey("");
    }
  };

  const decideProfile = async (action) => {
    setModerating(true);
    try {
      const endpoint = action === "approve" ? "approve-deputy" : "reject-deputy";
      await axios.post(
        `${BACKEND_URL}/api/musician/${endpoint}`,
        { id: musician._id },
        { headers: authHeaders },
      );
      setMusician((current) => ({
        ...current,
        status: action === "approve" ? "approved" : "rejected",
        aiBioReviewRequired: false,
        aiTaglineReviewRequired: false,
      }));
      toast.success(action === "approve" ? "Profile approved" : "Profile rejected");
    } catch (err) {
      toast.error(err?.response?.data?.message || `Could not ${action} profile`);
    } finally {
      setModerating(false);
    }
  };

  const instrumentation = Array.isArray(musician?.instrumentation)
    ? musician.instrumentation
        .map((item) => {
          const instrument = item?.instrument || "";
          const level = item?.skill_level ? ` (${item.skill_level})` : "";
          return instrument ? `${instrument}${level}` : "";
        })
        .filter(Boolean)
    : [];

  const vocalTypes = Array.isArray(musician?.vocals?.type)
    ? musician.vocals.type.filter(Boolean)
    : [];

  const otherSkills = Array.isArray(musician?.other_skills)
    ? musician.other_skills.filter(Boolean)
    : [];

  const logistics = Array.isArray(musician?.logistics)
    ? musician.logistics.filter(Boolean)
    : [];

  const functionBands = Array.isArray(musician?.function_bands_performed_with)
    ? musician.function_bands_performed_with
        .map((item) => item?.function_band_name)
        .filter(Boolean)
    : [];

  const originalBands = Array.isArray(musician?.original_bands_performed_with)
    ? musician.original_bands_performed_with
        .map((item) => item?.original_band_name)
        .filter(Boolean)
    : [];

  const sessions = Array.isArray(musician?.sessions)
    ? musician.sessions
        .map((item) => [item?.artist, item?.session_type].filter(Boolean).join(" — "))
        .filter(Boolean)
    : [];

  const academic = Array.isArray(musician?.academic_credentials)
    ? musician.academic_credentials
        .map((item) => {
          const parts = [item?.education_level, item?.course, item?.institution]
            .filter(Boolean)
            .join(" — ");
          return item?.years ? `${parts} (${item.years})` : parts;
        })
        .filter(Boolean)
    : [];

  const awards = Array.isArray(musician?.awards)
    ? musician.awards
        .map((item) => {
          const desc = item?.description || "";
          return item?.years ? `${desc} (${item.years})` : desc;
        })
        .filter(Boolean)
    : [];

  const repertoire =
    Array.isArray(musician?.repertoire) && musician.repertoire.length
      ? musician.repertoire
      : Array.isArray(musician?.selectedSongs)
      ? musician.selectedSongs
      : [];

  if (loading) {
    return <div className="p-6 text-gray-600">Loading musician profile…</div>;
  }

  if (error || !musician) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-black mb-4"
        >
          ← Back
        </button>
        <div className="bg-white border border-red-200 text-red-700 rounded-xl p-4">
          {error || "Musician profile not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-black">
          ← Back
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {reviewMode ? (
            <button
              type="button"
              onClick={() => navigate(`/moderate-deputy/edit/${musician._id}`)}
              className="px-4 py-2 rounded-xl bg-blue-700 text-sm font-medium text-white hover:bg-blue-800"
            >
              Edit full profile form
            </button>
          ) : null}
          {publicProfileUrl ? (
            <a
              href={publicProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
            >
              Open public profile
            </a>
          ) : null}
        </div>
      </div>

      {reviewMode ? (
        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-950 px-5 py-4 text-white">
            <div>
              <h2 className="text-xl font-semibold">Client-view profile preview</h2>
              <p className="mt-1 text-sm text-gray-300">This is the live public profile the client sees.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={moderating}
                onClick={() => decideProfile("approve")}
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve profile
              </button>
              <button
                type="button"
                disabled={moderating}
                onClick={() => decideProfile("reject")}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
          {publicProfileUrl ? (
            <iframe
              key={`${publicProfileUrl}-${musician?.profileLastReviewedAt || "draft"}`}
              src={publicProfileUrl}
              title={`${fullName} client-view profile`}
              className="h-[850px] w-full bg-white"
            />
          ) : (
            <p className="p-5 text-gray-500">A public profile URL has not been created yet.</p>
          )}
        </section>
      ) : null}

      {reviewMode ? (
        <section className="mb-8 rounded-2xl border border-dashed border-gray-400 bg-gray-100 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending content and moderator edits</h2>
              <p className="mt-1 text-sm text-gray-600">Grey content is private until you save and approve it.</p>
            </div>
            <button
              type="button"
              onClick={saveReviewCopy}
              disabled={savingReview}
              className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingReview ? "Saving…" : "Save edits"}
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-medium text-gray-800">
              Tagline
              <input
                value={taglineDraft}
                maxLength={120}
                onChange={(event) => setTaglineDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              />
              <span className="mt-1 block text-right text-xs text-gray-500">{taglineDraft.length}/120</span>
            </label>
            <label className="text-sm font-medium text-gray-800 lg:row-span-2">
              Biography
              <textarea
                value={bioDraft}
                onChange={(event) => setBioDraft(event.target.value)}
                rows={9}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              />
            </label>
          </div>
        </section>
      ) : null}

      {reviewMode ? (
        <section className={`${sectionCardClass} mb-8`}>
          <h2 className={sectionTitleClass}>Review all supplied videos</h2>
          {directVideoSubmissions.length ? (
            <div className="mb-5 grid gap-4 md:grid-cols-2">
              {directVideoSubmissions.map((submission) => {
                const key = `direct-${submission._id}`;
                return (
                  <article key={submission._id} className="overflow-hidden rounded-xl border border-fuchsia-200 bg-white">
                    {submission.accessUrl ? <video src={submission.accessUrl} controls playsInline className="aspect-video w-full bg-black" /> : null}
                    <div className="p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-semibold">{submission.suppliedTitle || submission.originalName || "Direct upload"}</p><p className="text-xs text-gray-500">Direct {submission.category || "function"} video upload</p></div>
                        <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-xs text-fuchsia-900">{String(submission.status || "").replaceAll("_", " ")}</span>
                      </div>
                      {submission.moderationReason ? <p className="mt-2 text-xs text-gray-600">{submission.moderationReason}</p> : null}
                      {submission.youtubeUrl ? <a href={submission.youtubeUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-blue-700 underline">{submission.youtubeUrl}</a> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {submission.status !== "published" ? <button type="button" disabled={videoActionKey === key} onClick={() => refreshDirectVideo(submission)} className="rounded border px-3 py-2 text-xs font-semibold disabled:opacity-50">Refresh checks</button> : null}
                        {["manual_required", "ready_for_review"].includes(submission.status) ? <button type="button" disabled={videoActionKey === key} onClick={() => decideDirectVideo(submission, "approve")} className="rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve and publish</button> : null}
                        {submission.status !== "published" && submission.status !== "rejected" ? <button type="button" disabled={videoActionKey === key} onClick={() => decideDirectVideo(submission, "reject")} className="rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Request clean replacement</button> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
          <ReviewVideoGrid
            groups={[
              { label: "Approved function video", category: "function", pending: false, items: musician?.tscApprovedFunctionBandVideoLinks },
              { label: "Approved original video", category: "original", pending: false, items: musician?.tscApprovedOriginalBandVideoLinks },
              { label: "Pending function video", category: "function", pending: true, items: musician?.functionBandVideoLinks },
              { label: "Pending original video", category: "original", pending: true, items: musician?.originalBandVideoLinks },
            ]}
            onApprove={approveVideo}
            onRequest={requestVideoResubmission}
            busyKey={videoActionKey}
          />
        </section>
      ) : null}

      {reviewMode ? (
        <section className={`${sectionCardClass} mb-8`}>
          <h2 className={sectionTitleClass}>Profile and cover images</h2>
          <p className="mb-4 text-sm text-gray-600">Open or download the original file for enhancement, then use View/Edit to upload the replacement.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <DownloadableImage url={normaliseImage(musician?.profilePhoto)} label="Profile image" />
            <DownloadableImage url={normaliseImage(musician?.coverHeroImage)} label="Cover image" />
          </div>
        </section>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
              {profileImage ? (
                <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-semibold">
                  {String(fullName || "M").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold mb-2">{fullName}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {instrumentation.slice(0, 4).map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full bg-white/10 text-sm border border-white/10"
                  >
                    {item}
                  </span>
                ))}
                {vocalTypes.slice(0, 2).map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full bg-[#ff6667] text-sm text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-white/80 max-w-3xl">
                {musician?.tagLine || musician?.tscApprovedBio || musician?.bio || "No bio added yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
          <InfoList
            items={[
              { label: "Status", value: musician?.status || "—" },
              { label: "Role", value: musician?.role || "musician" },
              { label: "Email", value: musician?.basicInfo?.email || musician?.email || "—" },
              { label: "Phone", value: musician?.basicInfo?.phone || musician?.phone || "—" },
              { label: "WhatsApp opt-in", value: musician?.whatsappOptIn ? "Yes" : "No" },
              { label: "County", value: musician?.address?.county || "—" },
              { label: "Postcode", value: musician?.address?.postcode || "—" },
              { label: "Date registered", value: formatDate(musician?.dateRegistered) },
              { label: "Onboarding", value: musician?.onboardingStatus || "—" },
              { label: "Last login", value: formatDate(musician?.lastLoginAt) },
              { label: "Password set", value: musician?.hasSetPassword ? "Yes" : "No" },
              { label: "Public slug", value: musician?.musicianSlug || "—" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-6">
          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Biography</h2>
            <div className="text-gray-700 leading-7">
              <FormattedBio value={musician?.tscApprovedBio || musician?.bio} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Skills & experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BulletList title="Instrumentation" items={instrumentation} />
              <BulletList
                title="Vocals"
                items={[
                  ...vocalTypes,
                  musician?.vocals?.range ? `Range: ${musician.vocals.range}` : "",
                  musician?.vocals?.gender ? `Gender: ${musician.vocals.gender}` : "",
                  musician?.vocals?.rap ? `Rap: ${musician.vocals.rap}` : "",
                ]}
              />
              <BulletList title="Other skills" items={otherSkills} />
              <BulletList title="Logistics" items={logistics} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Career & credits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BulletList title="Academic credentials" items={academic} />
              <BulletList title="Awards" items={awards} />
              <BulletList title="Function projects" items={functionBands} />
              <BulletList title="Original projects" items={originalBands} />
              <BulletList title="Sessions" items={sessions} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VideoList
                title="Approved function videos"
                items={musician?.tscApprovedFunctionBandVideoLinks}
              />
              <VideoList
                title="Approved original videos"
                items={musician?.tscApprovedOriginalBandVideoLinks}
              />
              <VideoList title="Function videos" items={musician?.functionBandVideoLinks} />
              <VideoList title="Original videos" items={musician?.originalBandVideoLinks} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Gallery</h2>
            <MediaScroller title="Black tie" items={musician?.digitalWardrobeBlackTie} />
            <MediaScroller title="Formal" items={musician?.digitalWardrobeFormal} />
            <MediaScroller title="Smart casual" items={musician?.digitalWardrobeSmartCasual} />
            <MediaScroller
              title="Session all black"
              items={musician?.digitalWardrobeSessionAllBlack}
            />
            <MediaScroller title="Additional images" items={musician?.additionalImages} />
          </section>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Contact & address</h2>
            <InfoList
              items={[
                { label: "First name", value: musician?.basicInfo?.firstName || musician?.firstName || "—" },
                { label: "Last name", value: musician?.basicInfo?.lastName || musician?.lastName || "—" },
                { label: "Email", value: musician?.basicInfo?.email || musician?.email || "—" },
                { label: "Phone", value: musician?.basicInfo?.phone || musician?.phone || "—" },
                { label: "Address line 1", value: musician?.address?.line1 || "—" },
                { label: "Address line 2", value: musician?.address?.line2 || "—" },
                { label: "Town", value: musician?.address?.town || "—" },
                { label: "County", value: musician?.address?.county || "—" },
                { label: "Postcode", value: musician?.address?.postcode || "—" },
                { label: "Country", value: musician?.address?.country || "—" },
              ]}
            />
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Equipment snapshot</h2>
            <InfoList
              items={[
                { label: "Wireless vocal mics", value: musician?.vocalMics?.wireless_vocal_mics || "—" },
                { label: "Wired vocal mics", value: musician?.vocalMics?.wired_vocal_mics || "—" },
                { label: "Wireless speech mic", value: musician?.speechMics?.wireless_speech_mic || "—" },
                { label: "Wired speech mic", value: musician?.speechMics?.wired_speech_mic || "—" },
                { label: "Wired in ear packs", value: musician?.inEarMonitoring?.wired_in_ear_packs || "—" },
                { label: "Wireless in ear packs", value: musician?.inEarMonitoring?.wireless_in_ear_packs || "—" },
                { label: "In ear monitors", value: musician?.inEarMonitoring?.in_ear_monitors || "—" },
                { label: "Extra instrument mics", value: musician?.instrumentMics?.extra_wired_instrument_mics || "—" },
                { label: "Wireless horn mics", value: musician?.instrumentMics?.wireless_horn_mics || "—" },
                { label: "Drum mic kit", value: musician?.instrumentMics?.drum_mic_kit || "—" },
                { label: "Mic stands", value: musician?.additionalEquipment?.mic_stands || "—" },
                { label: "DI boxes", value: musician?.additionalEquipment?.di_boxes || "—" },
                { label: "Wireless guitar jacks", value: musician?.additionalEquipment?.wireless_guitar_jacks || "—" },
              ]}
            />
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Bank details</h2>
            <InfoList
              items={[
                { label: "Account name", value: musician?.bank_account?.account_name || "—" },
                { label: "Account type", value: musician?.bank_account?.account_type || "—" },
                { label: "Sort code", value: musician?.bank_account?.sort_code || "—" },
                { label: "Account number", value: musician?.bank_account?.account_number || "—" },
              ]}
            />
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Repertoire</h2>
            {repertoire.length ? (
              <div className="max-h-[420px] overflow-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Title</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Artist</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Genre</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repertoire.map((song, index) => (
                      <tr
                        key={`${song?.title || "song"}-${index}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-800">{song?.title || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{song?.artist || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{song?.genre || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{song?.year || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No repertoire added yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Musician;
