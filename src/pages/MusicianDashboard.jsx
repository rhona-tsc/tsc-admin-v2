import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardUnderConstruction from "../components/DashboardUnderConstruction";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com";

const publicSiteBase =
  import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:5174";

  const ADMIN_EMAIL = "hello@thesupremecollective.co.uk";
/* -------------------- avatar helpers (same idea as DeputiesInput) -------------------- */
const pickUrl = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    const u = v.secure_url || v.secureUrl || v.url || v.path || v.location || v.src;
    return typeof u === "string" ? u.trim() : "";
  }
  return "";
};

const getProfileImageUrl = (u) => {
  const direct =
    pickUrl(u?.profilePhoto) ||
    pickUrl(u?.profilePicture) ||
    pickUrl(u?.profile_picture) ||
    pickUrl(u?.profileImage) ||
    pickUrl(u?.profile_image);

  const additional0 = Array.isArray(u?.additionalImages) ? pickUrl(u.additionalImages[0]) : "";
  return (direct || additional0 || "").trim();
};

const getUserId = (u) =>
  String(u?.id || u?._id || u?.musicianId || u?.musician_id || "").trim();

const initials = (u) => {
  const f = String(u?.firstName || u?.firstname || "").trim();
  const l = String(u?.lastName || u?.lastname || "").trim();
  return `${f[0] || ""}${l[0] || ""}`.toUpperCase() || "You";
};

const lastInitial = (u) => {
  const l = String(u?.lastName || u?.lastname || "").trim();
  return l ? l.charAt(0).toUpperCase() : "";
};

const getStripeConnectSummary = (u) => {
  const stripeConnect = u?.stripeConnect || {};

  const accountId = String(stripeConnect?.accountId || "").trim();
  const chargesEnabled = Boolean(stripeConnect?.chargesEnabled);
  const payoutsEnabled = Boolean(stripeConnect?.payoutsEnabled);
  const onboardingComplete = Boolean(stripeConnect?.onboardingComplete);
  const detailsSubmitted = Boolean(stripeConnect?.detailsSubmitted);

  const isReady = Boolean(accountId && payoutsEnabled && (chargesEnabled || onboardingComplete || detailsSubmitted));

  return {
    accountId,
    chargesEnabled,
    payoutsEnabled,
    onboardingComplete,
    detailsSubmitted,
    isReady,
  };
};

const getStripePayoutUi = (u) => {
  const stripe = getStripeConnectSummary(u);

  if (stripe.isReady) {
    return {
      label: "Ready for payouts",
      tone: "ready",
      helper: "Your Stripe payout setup is complete.",
      buttonLabel: "Update Stripe payout setup",
    };
  }

  return {
    label: "Payout setup incomplete",
    tone: "incomplete",
    helper: "Connect Stripe so deputy payouts can be released to you.",
    buttonLabel: stripe.accountId ? "Finish Stripe setup" : "Connect Stripe",
  };
};



/* -------------------- Right Profile Card -------------------- */
const YourProfileCard = ({ me, fallbackFirstName, deputyCTA, token }) => {
  const navigate = useNavigate();
  const [imgBroken, setImgBroken] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");

  const id = useMemo(() => getUserId(me), [me]);
  const imgUrl = useMemo(() => getProfileImageUrl(me), [me]);
  const ctaLabel = deputyCTA?.label || "Join The Books";
  const ctaPath = deputyCTA?.path || "/register-as-deputy";
  const firstName =
    String(me?.firstName || me?.firstname || "").trim() ||
    String(fallbackFirstName || "").trim() ||
    "there";

  const nameLine = `${firstName} ${lastInitial(me)}`.trim();
  const payoutUi = useMemo(() => getStripePayoutUi(me), [me]);

  const slug = String(me?.musicianSlug || "").trim();
  const viewHref = slug
    ? `${publicSiteBase}/musician/${slug}`
    : id
      ? `${publicSiteBase}/musician/${id}`
      : "";

  const handleConnectStripe = useCallback(async () => {
    try {
      setStripeLoading(true);
      setStripeError("");

      const tokenToUse =
        token ||
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("musicianToken") ||
        "";

      const response = await axios.post(
        `${backendUrl}/api/musician/account/stripe-connect/onboarding-link`,
        {},
        {
          headers: {
            token: tokenToUse,
            Authorization: tokenToUse ? `Bearer ${tokenToUse}` : "",
          },
          withCredentials: true,
        }
      );

      const onboardingUrl = response?.data?.url || "";
      if (!onboardingUrl) {
        throw new Error("No Stripe onboarding link returned");
      }

      window.location.href = onboardingUrl;
    } catch (err) {
      console.error("❌ Failed to create Stripe onboarding link:", err);
      setStripeError(
        err?.response?.data?.message ||
          err?.message ||
          "We couldn't start Stripe onboarding right now. Please try again."
      );
    } finally {
      setStripeLoading(false);
    }
  }, [token]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-gray-500">Your Profile</p>

      <div className="mt-4 flex flex-col items-center text-center">
        {imgUrl && !imgBroken ? (
          <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center">
            <img
              src={imgUrl}
              alt={nameLine}
              className="w-full h-full object-cover"
              onError={() => setImgBroken(true)}
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full border border-gray-200 bg-gray-100 text-gray-700 text-2xl font-semibold flex items-center justify-center">
            {initials(me)}
          </div>
        )}

        <p className="text-sm text-gray-600">{nameLine}</p>

        {viewHref ? (
          <a
            href={viewHref}
            className="text-sm text-[#ff6667] underline mt-2 hover:text-black transition"
            target="_blank"
            rel="noreferrer"
          >
            View profile
          </a>
        ) : (
          <span className="text-xs text-gray-400 mt-2">
            Profile link will appear once your account is ready.
          </span>
        )}

        <div className="mt-4 w-full">
          <p className="text-xs text-gray-500 mb-2">
            Keep your profile updated so acts can find you faster.
          </p>

          <button
            type="button"
            onClick={() => navigate(ctaPath)}
            className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-[#ff6667] text-white font-semibold hover:bg-black transition"
          >
            {ctaLabel}
          </button>
        </div>

        <div className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Deputy payouts</p>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{payoutUi.label}</p>
              <p className="text-xs text-gray-500 mt-1">{payoutUi.helper}</p>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                payoutUi.tone === "ready"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {payoutUi.tone === "ready" ? "Ready" : "Action needed"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConnectStripe}
            disabled={stripeLoading}
            className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-black text-white font-semibold hover:bg-[#ff6667] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {stripeLoading ? "Opening Stripe…" : payoutUi.buttonLabel}
          </button>

          {stripeError ? (
            <p className="mt-3 text-xs text-red-600">{stripeError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const StarRow = ({ value = 0 }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const halfStar = !filled && half && i === full + 1;
        return (
          <span
            key={i}
            className={filled || halfStar ? "text-[#ff6667] text-lg" : "text-gray-300 text-lg"}
            aria-hidden="true"
            title={`${v}/5`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const PeerReviewCard = ({ peer }) => {
  const avg = peer?.average;
  const count = peer?.count;

  const categories = peer?.categories || [
    { label: "Technical Skill", value: null },
    { label: "Team Spirit", value: null },
    { label: "Preparation", value: null },
    { label: "Timeliness", value: null },
    { label: "Stage Presence", value: null },
    { label: "Client Satisfaction", value: null },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-gray-500">Peer Review</p>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overall rating</p>
            <p className="text-2xl font-semibold text-gray-900">
              {typeof avg === "number" ? avg.toFixed(1) : "—"}
              <span className="text-sm font-normal text-gray-500"> / 5</span>
            </p>
          </div>

          <div className="text-right">
            <StarRow value={typeof avg === "number" ? avg : 0} />
            <p className="mt-1 text-xs text-gray-500">
              {typeof count === "number" ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {categories.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{c.label}</span>
              {typeof c.value === "number" ? (
                <StarRow value={c.value} />
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          ))}
        </div>

       <button
  type="button"
  className="mt-5 inline-flex items-center justify-center w-full px-4 py-2 rounded-md
             bg-gray-200 text-gray-500 font-semibold border border-gray-300
             opacity-80 cursor-not-allowed pointer-events-none"
>
  Request a peer review — Coming Soon
</button>
      </div>
    </div>
  );
};

const MusicianDashboard = ({ token, userId, firstName }) => {
  const navigate = useNavigate();
const [peerReview, setPeerReview] = useState(null);
const adminEmail = ADMIN_EMAIL.toLowerCase();
  const [myActs, setMyActs] = useState([]);
  const [deppingActs, setDeppingActs] = useState([]);
  const [stats, setStats] = useState({
    enquiries: [],
    bookings: [],
    cash: [],
  });

  // NEW: store the logged-in musician doc (for avatar + last initial etc.)
  const [me, setMe] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const storedUserId =
    sessionStorage.getItem("userId") || localStorage.getItem("userId");

  if (!storedUserId) {
    console.error("❌ No stored userId!");
  }

  
  // add near the top of the file (or inside MusicianDashboard)
const normalize = (s) => (s || "").toLowerCase().trim();
const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s || "");

// ✅ same CTA helper as Sidebar
const getDeputyCTA = (status, id) => {
  const st = normalize(status);
  if (st === "approved" || st === "approved, changes pending") {
    return id
      ? {
          label:
            st === "approved"
              ? "Update My Profile"
              : "Update My Profile Submission",
          path: `/edit-deputy/${id}`,
        }
      : { label: "Join The Books", path: "/register-as-deputy" };
  }
  return { label: "Join The Books", path: "/register-as-deputy" };
};

const [myDeputyStatus, setMyDeputyStatus] = useState(
  localStorage.getItem("myDeputyStatus") ||
    localStorage.getItem("deputyStatus") ||
    null
);

const musicianId = useMemo(() => {
  const fromProps = userId;
  const fromLS = localStorage.getItem("musicianId") || localStorage.getItem("userId");
  if (isObjectId(fromProps)) return fromProps;
  if (isObjectId(fromLS)) return fromLS;
  return null;
}, [userId]);

useEffect(() => {
  if (!musicianId) return;

  (async () => {
    try {
      const t = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/api/moderation/deputy/${musicianId}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        withCredentials: true,
      });

      if (res.data?.success && res.data.deputy) {
        const status = (res.data.deputy.status || "").trim();
        setMyDeputyStatus(status);
        localStorage.setItem("myDeputyStatus", status);
        localStorage.setItem("deputyStatus", status);
      }
    } catch (e) {
      console.error("❌ Failed to fetch deputy:", e);
    }
  })();
}, [musicianId]);

const deputyCTA = useMemo(
  () => getDeputyCTA(myDeputyStatus, musicianId),
  [myDeputyStatus, musicianId]
);

const isAdminAgent = useMemo(() => {
  const meEmail = String(
    me?.email || me?.basicInfo?.email || localStorage.getItem("userEmail") || ""
  )
    .toLowerCase()
    .trim();

  return meEmail === adminEmail;
}, [me, adminEmail]);

  // helper headers: some endpoints want token, others want Bearer
  const headers = useMemo(
    () => ({
      token,
      Authorization: token ? `Bearer ${token}` : undefined,
    }),
    [token]
  );

  const fetchPeerReview = async () => {
  const id = storedUserId || userId;
  if (!id) return;

  const candidates = [
    `${backendUrl}/api/peer-review/summary/${id}`,
    `${backendUrl}/api/peer-reviews/summary/${id}`,
    `${backendUrl}/api/reviews/peer/summary/${id}`,
    `${backendUrl}/api/musician/${id}/peer-review-summary`,
  ];

  for (const url of candidates) {
    try {
      const res = await axios.get(url, { headers });
      const payload = res?.data;

      const summary =
        payload?.summary ||
        payload?.peerReview ||
        payload?.data ||
        payload ||
        null;

      if (summary && (typeof summary.average === "number" || typeof summary.count === "number")) {
        setPeerReview(summary);
        return;
      }
    } catch {
      // keep trying
    }
  }

  // no endpoint yet? don’t error — just show placeholders
  setPeerReview(null);
};

  // -------- Fetch my musician profile for avatar card (robust endpoint attempts) --------
  const fetchMe = async () => {
    const id = storedUserId || userId;
    if (!id) return;

    const candidates = [
      `${backendUrl}/api/musician/${id}`,
      `${backendUrl}/api/musicians/${id}`,
      `${backendUrl}/api/musician/profile/${id}`,
      `${backendUrl}/api/musician/get/${id}`,
      `${backendUrl}/api/musician/dashboard/${id}`, // sometimes returns user-ish data
    ];

    for (const url of candidates) {
      try {
        const res = await axios.get(url, { headers });

        // Try common shapes:
        const payload = res?.data;
        const doc =
          payload?.musician ||
          payload?.user ||
          payload?.data ||
          payload ||
          null;

        // Only accept if it looks like a musician/user record
        if (doc && (getUserId(doc) || doc?.firstName || doc?.email)) {
          setMe(doc);
          return;
        }
      } catch (e) {
        // keep trying
      }
    }

    // fallback so initials at least work
    setMe((prev) => prev || { _id: storedUserId || userId, firstName });
  };

  // ----------------- Fetch stats -----------------
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/musician/stats/${storedUserId}`,
        { headers }
      );
      setStats(res.data || {});
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

  // Fetch user’s acts (created by them)
  const fetchMyActs = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/musician/act-v2/list?mine=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const acts = Array.isArray(res.data.acts) ? res.data.acts : [];

      const filteredActs = acts.filter(
        (act) => act?.createdBy?.toString?.() === storedUserId?.toString?.()
      );

      setMyActs(filteredActs);
    } catch (err) {
      console.error("Error fetching my acts", err);
    }
  };

  // Fetch acts where musician is a deputy
  const fetchDeppingActs = async () => {
    try {
      const id = storedUserId || userId;
      const res = await axios.get(`${backendUrl}/api/musician/depping/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeppingActs(res.data.acts || []);
    } catch (err) {
      console.error("Error fetching depping acts", err);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchMyActs();
    fetchDeppingActs();
    fetchStats();
     fetchPeerReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (You had this duplicate; leaving it, but it may overwrite stats shape)
  useEffect(() => {
    const id = storedUserId || userId;
    if (!id) return;

    axios
      .get(`${backendUrl}/api/musician/dashboard/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div className="p-4">
      {/* MAIN + RIGHT SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: dashboard content */}
        <div className="lg:col-span-9 ">
          {/* 🚧 UNDER CONSTRUCTION BANNER */}
          <DashboardUnderConstruction firstname={firstName} />
 
  <div className="my-6 overflow-hidden rounded-2xl border border-[#ffd6d6] bg-gradient-to-br from-[#fff7f7] via-white to-[#fff1f1] p-5 shadow-[0_12px_35px_rgba(255,102,103,0.14)] ring-1 ring-[#ff6667]/10">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="inline-flex items-center rounded-full bg-[#ff6667]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6667]">
          New on the portal
        </div>
        <h3 className="mt-3 text-xl font-semibold text-gray-900">Deputy Jobs are live</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          You can now post your own deputy jobs, apply to opportunities in one click, and keep your profile updated so bands and bookers can check out your experience, skills, and media when you apply.
        </p>
      </div>

      <div className="shrink-0 rounded-xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:max-w-[250px]">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Quick reminder
        </p>
        <p className="mt-1 text-sm text-gray-700">
          Make sure your deputy profile is up to date so the right jobs find you and bands can view your profile with confidence.
        </p>
      </div>
    </div>

    <div className="mt-5 rounded-2xl border border-[#ffe1e1] bg-white/80 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[#fff7f7] p-4 border border-[#ffdede]">
          <p className="text-sm font-semibold text-gray-900">Post your own deputy jobs</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Create opportunities directly from the portal and reach matched musicians faster.
          </p>
        </div>

        <div className="rounded-xl bg-[#fff7f7] p-4 border border-[#ffdede]">
          <p className="text-sm font-semibold text-gray-900">Apply in one click</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            See relevant deputy roles and send your application quickly when something suits you.
          </p>
        </div>

        <div className="rounded-xl bg-[#fff7f7] p-4 border border-[#ffdede]">
          <p className="text-sm font-semibold text-gray-900">Keep your profile fresh</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Bands may check your profile before choosing a deputy, so it’s worth keeping your skills, media, and experience up to date.
          </p>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
      <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 border border-[#ffe1e1]">
        One-click applications
      </span>
      <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 border border-[#ffe1e1]">
        Post your own deputy jobs
      </span>
      <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 border border-[#ffe1e1]">
        Keep your profile fresh
      </span>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => navigate("/deputy-jobs")}
        className="group w-full rounded-2xl border border-[#ffd0d1] bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#ff6667] hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-gray-900 transition group-hover:text-[#ff6667]">
              Open Deputy Jobs Board
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Browse live jobs, apply quickly, and keep track of deputy opportunities.
            </p>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f1] text-[#ff6667] transition group-hover:bg-[#ff6667] group-hover:text-white">
            →
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => navigate("/deputy-jobs/create")}
        className="group w-full rounded-2xl border border-[#ffd0d1] bg-[#111111] p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff6667] hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-white">
              Create Deputy Job
            </p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Post a new deputy opportunity and notify matching musicians.
            </p>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20">
            +
          </span>
        </div>
      </button>
    </div>
  </div>

          {/* ------- Quick Stats ------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 space-y-2 md:space-y-0 my-6">
            <div className="p-4 bg-white shadow rounded">
              <p className="text-sm text-gray-500">Acts You Lead</p>
              <p className="text-3xl font-bold">{myActs.length}</p>
            </div>

            <div className="p-4 bg-white shadow rounded">
              <p className="text-sm text-gray-500">Acts You Dep For</p>
              <p className="text-3xl font-bold">{deppingActs.length}</p>
            </div>

        

            <div className="p-4 bg-white shadow rounded">
              <p className="text-sm text-gray-500">Booking Enquiries (Last 30d)</p>
              <p className="text-3xl font-bold">
                {stats.enquiries?.slice(-1)[0]?.count || 0}
              </p>
            </div>
          </div>

          {/* ------- Acts You Lead ------- */}
          <div className="bg-white shadow rounded gap-4 space-y-2 md:space-y-0 my-6 p-4">
            <h3 className="text-lg font-semibold mb-3">Acts You Lead</h3>
            {myActs.length === 0 ? (
              <p className="text-gray-600">You haven't registered any acts yet.</p>
            ) : (
              myActs.map((act) => (
                <div
                  key={act._id}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/edit-act-2/${act._id}`)}
                >
                  {act.name}
                </div>
              ))
            )}
          </div>

          {/* ------- Acts You're Depping For ------- */}
          <div className="bg-white shadow rounded p-4 gap-4 space-y-2 md:space-y-0 my-6">
            <h3 className="text-lg font-semibold mb-3">Acts You're Depping For</h3>
            {deppingActs.length === 0 ? (
              <p className="text-gray-600">No depping roles yet.</p>
            ) : (
              deppingActs.map((act) => (
                <div
                  key={act._id}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/act/${act._id}`)}
                >
                  {act.name}
                </div>
              ))
            )}
          </div>


          {/* ------- Noticeboard ------- */}
          <div className="bg-white shadow rounded p-4 gap-4 space-y-2 md:space-y-0 my-6">
            <h3 className="text-lg font-semibold mb-4">Noticeboard</h3>
            <p className="text-gray-600">
              Important updates, opportunities, and announcements will appear here.
            </p>
          </div>

          {/* ------- Feedback Section ------- */}
          <div className="bg-white shadow rounded p-4 gap-4 space-y-2 md:space-y-0 my-6">
            <h3 className="text-lg font-semibold mb-3">Feedback</h3>
            <p className="text-gray-600 mb-3">
              Help us improve your dashboard and musician tools.
            </p>
            <textarea
              className="w-full border rounded p-2 h-28"
              placeholder="Share your feedback..."
            ></textarea>
            <button className="mt-3 px-4 py-2 bg-black hover:bg-[#ff6667] text-white rounded">
              Submit Feedback
            </button>
          </div>

  
        </div>

       {/* RIGHT: sticky sidebar (profile + peer review) */}
<div className="lg:col-span-3">
  <div className="sticky top-6 space-y-4">
<YourProfileCard
  me={me}
  fallbackFirstName={firstName}
  deputyCTA={deputyCTA}
  token={token}
/>    <PeerReviewCard peer={peerReview} />
  </div>
</div>
      </div>
    </div>
  );
};

export default MusicianDashboard;