  // admin/src/pages/BookingBoard.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = (
  import.meta?.env?.VITE_ADMIN_API_BASE ||
  (import.meta?.env?.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "") ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

// Where to send someone if there’s no eventSheetLink on the row
const PUBLIC_SITE_BASE = (import.meta?.env?.VITE_PUBLIC_SITE_URL || "http://localhost:5174").replace(/\/$/, "");
const EVENT_SHEET_FALLBACK = `${PUBLIC_SITE_BASE}/event-sheet`;
const ACT_TSC_NAME_OVERRIDES = {
  "motown magic": "Dance Floor Magic",
};

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  "";

const getPrimaryEmail = (row) => {
  return (
    row?.clientEmails?.find?.((e) => e?.email)?.email ||
    row?.clientEmail ||
    row?.userAddress?.email ||
    row?.userEmail ||
    ""
  );
};

const getClientFirstNames = (row) => {
  if (row?.clientFirstNames) return row.clientFirstNames;

  const first = row?.userAddress?.firstName || "";
  const last = row?.userAddress?.lastName || "";
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const clientNames =
    row?.eventSheet?.complete?.client_names ||
    row?.eventSheet?.answers?.client_names ||
    "";
  if (clientNames) return String(clientNames).trim();

  const p1 = [row?.eventSheet?.answers?.partner1_first, row?.eventSheet?.answers?.partner1_last]
    .filter(Boolean)
    .join(" ")
    .trim();
  const p2 = [row?.eventSheet?.answers?.partner2_first, row?.eventSheet?.answers?.partner2_last]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (p1 || p2) return [p1, p2].filter(Boolean).join(" & ");

  return row?.bookerName || "—";
};

const getDisplayBookingRef = (row) => {
  return row?.bookingRef || row?.bookingId || row?.reference || row?._id || "—";
};

const getDisplayEventDate = (row) => {
  return row?.eventDateISO || row?.date || row?.eventDate || row?.bookingDate || "";
};

const getDisplayGross = (row) => {
  return Number(
    row?.grossValue ||
    row?.totals?.fullAmount ||
    row?.quote?.total ||
    row?.pricing?.total ||
    row?.amount ||
    row?.fee ||
    0
  );
};

const getDisplayDeposit = (row) => {
  const backendDeposit = Number(
    row?.payments?.depositChargedAmount ??
    row?.payments?.depositAmount ??
    row?.totals?.depositAmount ??
    row?.quote?.deposit ??
    row?.pricing?.deposit ??
    row?.depositAmount ??
    0
  );
  return backendDeposit > 0 ? backendDeposit : null;
};

const getDisplayArrivalTime = (row) => {
  return (
    row?.arrivalTime ||
    row?.performanceTimes?.arrivalTime ||
    row?.actsSummary?.[0]?.performance?.arrivalTime ||
    row?.eventSheet?.answers?.schedule_simple_arrival ||
    ""
  );
};

const getDisplayFinishTime = (row) => {
  return (
    row?.finishTime ||
    row?.performanceTimes?.finishTime ||
    row?.actsSummary?.[0]?.performance?.finishTime ||
    row?.eventSheet?.answers?.schedule_simple_finish_time ||
    ""
  );
};

const getDisplayActName = (row) => {
  return (
    row?.actName ||
    row?.actsSummary?.[0]?.actName ||
    row?.actsSummary?.[0]?.name ||
    row?.act?.name ||
    row?.selectedAct?.name ||
    ""
  );
};

const getDisplayActTscName = (row) => {
  const raw = (
    row?.actTscName ||
    row?.tscName ||
    row?.actsSummary?.[0]?.tscName ||
    row?.act?.tscName ||
    row?.selectedAct?.tscName ||
    row?.actsSummary?.[0]?.name ||
    row?.act?.name ||
    row?.selectedAct?.name ||
    ""
  );

  const override = ACT_TSC_NAME_OVERRIDES[String(raw || "").trim().toLowerCase()];
  return override || raw;
};

const getDisplayAddress = (row) => {
  if (row?.venueAddress) return row.venueAddress;
  if (row?.venue) return row.venue;
  if (row?.address) return row.address;

  const addr = row?.userAddress || {};
  const joined = [
    addr?.address1,
    addr?.address2,
    addr?.street,
    addr?.city,
    addr?.county,
    addr?.postcode,
  ]
    .filter(Boolean)
    .join(", ")
    .trim();

  return joined || "";
};

const getDisplayCounty = (row) => {
  if (row?.county) return row.county;
  if (row?.userAddress?.county) return row.userAddress.county;
  if (row?.eventSheet?.answers?.venue_county) return row.eventSheet.answers.venue_county;

  const source = row?.venueAddress || row?.venue || row?.address || "";
  const bits = String(source)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^uk$/i.test(s) && !/^united kingdom$/i.test(s));

  if (bits.length >= 2) {
    const guess = bits[bits.length - 2];
    if (guess && !/^[A-Z]{1,2}\d/i.test(guess)) return guess;
  }

  return "";
};

const getDisplayClientEmails = (row) => {
  if (Array.isArray(row?.clientEmails) && row.clientEmails.length) return row.clientEmails;
  const email = getPrimaryEmail(row);
  return email ? [{ email }] : [];
};

const hasContractLink = (row) => {
  const contractUrl = row?.contractUrl || row?.pdfUrl || (row?.contract && (row.contract.url || row.contract.href)) || "";
  return Boolean(normalizeUrl(contractUrl));
};

const getPrimaryActKey = (row) => {
  return String(getDisplayActTscName(row) || getDisplayActName(row) || "").trim().toLowerCase();
};

const getMergeKey = (row) => {
  const bookingRef = String(getDisplayBookingRef(row) || "").trim().toLowerCase();
  if (bookingRef) return `ref:${bookingRef}`;

  const email = String(getPrimaryEmail(row) || "").trim().toLowerCase();
  const eventDate = String(getDisplayEventDate(row) || "").slice(0, 10);
  const actKey = getPrimaryActKey(row);
  const names = String(getClientFirstNames(row) || "").trim().toLowerCase();

  return `fallback:${email}|${eventDate}|${actKey}|${names}`;
};

const chooseBetterRow = (current, incoming) => {
  if (!current) return incoming;
  if (!incoming) return current;

  const currentHasContract = hasContractLink(current);
  const incomingHasContract = hasContractLink(incoming);

  if (incomingHasContract && !currentHasContract) return { ...current, ...incoming };
  if (currentHasContract && !incomingHasContract) return { ...incoming, ...current };

  const currentScore = [
    currentHasContract,
    Boolean(getDisplayGross(current)),
    Boolean(getDisplayDeposit(current)),
    Boolean(getDisplayActName(current) || getDisplayActTscName(current)),
    Boolean(getDisplayAddress(current)),
    Boolean(getPrimaryEmail(current)),
    Boolean(current?.eventType),
    Boolean(current?.lineupSelected || current?.actsSummary?.[0]?.lineupLabel),
  ].filter(Boolean).length;

  const incomingScore = [
    incomingHasContract,
    Boolean(getDisplayGross(incoming)),
    Boolean(getDisplayDeposit(incoming)),
    Boolean(getDisplayActName(incoming) || getDisplayActTscName(incoming)),
    Boolean(getDisplayAddress(incoming)),
    Boolean(getPrimaryEmail(incoming)),
    Boolean(incoming?.eventType),
    Boolean(incoming?.lineupSelected || incoming?.actsSummary?.[0]?.lineupLabel),
  ].filter(Boolean).length;

  if (incomingScore > currentScore) return { ...current, ...incoming };
  if (currentScore > incomingScore) return { ...incoming, ...current };

  const currentUpdated = new Date(current?.updatedAt || current?.createdAt || 0).getTime() || 0;
  const incomingUpdated = new Date(incoming?.updatedAt || incoming?.createdAt || 0).getTime() || 0;

  if (incomingUpdated >= currentUpdated) return { ...current, ...incoming };
  return { ...incoming, ...current };
};

const isInternalTestBooking = (row) => {
  const email = getPrimaryEmail(row).toLowerCase();
  const actName = getDisplayActName(row).toLowerCase();
  const actTscName = getDisplayActTscName(row).toLowerCase();
  const bookingRef = String(getDisplayBookingRef(row) || "").toLowerCase();
  const clientName = String(getClientFirstNames(row) || "").toLowerCase();
  const bookerName = String(row?.bookerName || "").toLowerCase();

  return (
    email.endsWith("@thesupremecollective.co.uk") ||
    email.includes("rhona") ||
    email.includes("downie") ||
    bookingRef.includes("downie") ||
    clientName.includes("downie") ||
    bookerName.includes("downie") ||
    actName.startsWith("test ") ||
    actTscName.startsWith("test ")
  );
};

const fmtOrdinal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const day = d.getDate();
  const j = day % 10, k = day % 100;
  const suffix = j === 1 && k !== 11 ? "st" : j === 2 && k !== 12 ? "nd" : j === 3 && k !== 13 ? "rd" : "th";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).replace(String(day), `${day}${suffix}`);
};
const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// --- Helpers for URL normalization, lineup, event sheet summary ---
const normalizeUrl = (u) => {
  if (!u || typeof u !== "string") return "";
  const s = u.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  // if it looks like a cloudinary or absolute path missing protocol
  if (s.startsWith("//")) return `https:${s}`;
  // otherwise treat as API-relative
  return `${API_BASE.replace(/\/api$/, "")}${s.startsWith("/") ? s : `/${s}`}`;
};

const buildFullLineup = (row) => {
  const label =
    row?.lineupSelected ||
    row?.actsSummary?.[0]?.lineupLabel ||
    row?.actsSummary?.[0]?.lineup?.actSize ||
    "";

  const parts = Array.isArray(row?.lineupComposition)
    ? [...row.lineupComposition]
    : Array.isArray(row?.actsSummary?.[0]?.lineup?.bandMembers)
      ? row.actsSummary[0].lineup.bandMembers
          .map((m) => m?.instrument)
          .filter(Boolean)
      : [];

  const serviceBits = [];
  const extras = Array.isArray(row?.extras)
    ? row.extras
    : Array.isArray(row?.bookingDetails?.extras)
      ? row.bookingDetails.extras
      : Array.isArray(row?.actsSummary?.[0]?.selectedExtras)
        ? row.actsSummary[0].selectedExtras
        : [];

  const namesFromExtras = (extras || [])
    .map((x) => (typeof x === "string" ? x : (x?.name || x?.key || "")))
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const hasSoundEng =
    /sound\s*eng/i.test(namesFromExtras.join(" ")) ||
    row?.services?.soundEngineering ||
    row?.bookingDetails?.soundEngineeringBooked ||
    row?.actsSummary?.[0]?.bandMembers?.some?.((m) =>
      Array.isArray(m?.additionalRoles) &&
      m.additionalRoles.some((r) => /sound\s*eng/i.test(String(r?.role || "")))
    ) ||
    row?.actsSummary?.[0]?.lineup?.bandMembers?.some?.((m) =>
      Array.isArray(m?.additionalRoles) &&
      m.additionalRoles.some((r) => /sound\s*eng/i.test(String(r?.role || "")))
    );

  if (hasSoundEng) {
    serviceBits.push("sound engineering");
  }

  serviceBits.push("band management services");

  const lineupBits = [];
  if (label) lineupBits.push(label);
  if (parts.length) lineupBits.push(parts.join(", "));
  if (serviceBits.length) lineupBits.push(`with ${serviceBits.join(" and ")}`);
  return lineupBits.filter(Boolean).join(", ");
};

const summariseEventSheetFirstSection = (row) => {
  const ans = row?.eventSheet?.answers || {};
  const p1 = [ans.partner1_first, ans.partner1_last].filter(Boolean).join(" ");
  const p2 = [ans.partner2_first, ans.partner2_last].filter(Boolean).join(" ");
  const intro = ans.introduced_as || "";
  const bits = [];
  if (p1 || p2) bits.push([p1, p2].filter(Boolean).join(" & "));
  if (intro) bits.push(`Introduced as: ${intro}`);
  return bits.join(" • ");
};

const Tag = ({ children }) => (
  <span className="inline-block px-2 py-1 text-xs rounded border">{children}</span>
);

const getExtrasFromRow = (row) => {
  if (Array.isArray(row?.actsSummary?.[0]?.selectedExtras)) {
    return row.actsSummary[0].selectedExtras.map((extra, index) => ({
      id: `${extra?.key || extra?.name || "extra"}-${index}`,
      key: extra?.key || "",
      name: extra?.name || extra?.key || "Extra",
      quantity: Number(extra?.quantity || 1) || 1,
      price: Number(extra?.price || 0) || 0,
      finishTime: extra?.finishTime || "",
      arrivalTime: extra?.arrivalTime || "",
    }));
  }

  if (Array.isArray(row?.bookingDetails?.extras)) {
    return row.bookingDetails.extras.map((extra, index) => ({
      id: `${extra?.key || extra?.name || "extra"}-${index}`,
      key: extra?.key || "",
      name: extra?.name || extra?.key || "Extra",
      quantity: Number(extra?.quantity || 1) || 1,
      price: Number(extra?.price || 0) || 0,
      finishTime: extra?.finishTime || "",
      arrivalTime: extra?.arrivalTime || "",
    }));
  }

  return [];
};

const getLikelyBandExtras = (row) => {
  const roles = [];
  const members = row?.actsSummary?.[0]?.lineup?.bandMembers || row?.actsSummary?.[0]?.bandMembers || [];

  members.forEach((member) => {
    if (!Array.isArray(member?.additionalRoles)) return;
    member.additionalRoles.forEach((role) => {
      const roleName = String(role?.role || "").trim();
      if (!roleName) return;
      if (!roles.some((r) => r.toLowerCase() === roleName.toLowerCase())) {
        roles.push(roleName);
      }
    });
  });

  const suggestions = [];

  if (roles.some((r) => /sound engineering/i.test(r))) {
    suggestions.push({
      key: "pa_and_lights_hire",
      name: "PA & Lights Hire",
      quantity: 1,
      price: 0,
      finishTime: row?.actsSummary?.[0]?.performance?.paLightsFinishTime || row?.performanceTimes?.paLightsFinishTime || "",
      arrivalTime: row?.actsSummary?.[0]?.performance?.arrivalTime || row?.performanceTimes?.arrivalTime || "",
    });
  }

  if (roles.some((r) => /dj/i.test(r))) {
    suggestions.push({
      key: "dj_service",
      name: "DJ Service",
      quantity: 1,
      price: 0,
      finishTime: row?.actsSummary?.[0]?.performance?.finishTime || row?.performanceTimes?.finishTime || "",
      arrivalTime: row?.actsSummary?.[0]?.performance?.arrivalTime || row?.performanceTimes?.arrivalTime || "",
    });
  }

  return suggestions;
};

const buildEditStateFromRow = (row) => {
  const gross = getDisplayGross(row);
  const depositFromBackend = getDisplayDeposit(row);
  const deposit = depositFromBackend != null ? depositFromBackend : (gross ? Math.ceil((Number(gross) - 50) * 0.2) + 50 : 0);
  const performance = row?.actsSummary?.[0]?.performance || row?.performanceTimes || {};

  return {
    _id: row?._id,
    bookingRef: getDisplayBookingRef(row),
    clientFirstNames: getClientFirstNames(row),
    actName: getDisplayActName(row),
    actTscName: getDisplayActTscName(row),
    eventDate: getDisplayEventDate(row),
    baseGross: Number(gross || 0),
    depositAmount: Number(deposit || 0),
    eventType: row?.eventType || "",
    venueAddress: getDisplayAddress(row),
    arrivalTime: performance?.arrivalTime || getDisplayArrivalTime(row) || "",
    startTime: performance?.startTime || "",
    finishTime: performance?.finishTime || getDisplayFinishTime(row) || "",
    paLightsFinishTime: performance?.paLightsFinishTime || "",
    paLightsFinishDayOffset: Number(performance?.paLightsFinishDayOffset || 0) || 0,
    extras: getExtrasFromRow(row),
    manualAdjustmentLabel: "",
    manualAdjustmentAmount: "",
    notes: row?.notes || "",
  };
};

function BookingUpdateModal({ row, value, onClose, onChange, onSave, saving }) {
  if (!row || !value) return null;

  const extrasTotal = (value.extras || []).reduce((sum, extra) => {
    return sum + (Number(extra?.price || 0) * Number(extra?.quantity || 1));
  }, 0);
  const manualAdjustmentAmount = Number(value.manualAdjustmentAmount || 0) || 0;
  const recalculatedGross = Number(value.baseGross || 0) + extrasTotal + manualAdjustmentAmount;
  const recalculatedBalance = Math.max(0, recalculatedGross - Number(value.depositAmount || 0));
  const likelyExtras = getLikelyBandExtras(row);

  const updateExtra = (id, patch) => {
    onChange({
      ...value,
      extras: (value.extras || []).map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
    });
  };

  const addExtra = (seed = {}) => {
    const next = {
      id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      key: seed.key || "",
      name: seed.name || "",
      quantity: Number(seed.quantity || 1) || 1,
      price: Number(seed.price || 0) || 0,
      finishTime: seed.finishTime || "",
      arrivalTime: seed.arrivalTime || value.arrivalTime || "",
    };

    onChange({
      ...value,
      extras: [...(value.extras || []), next],
    });
  };

  const removeExtra = (id) => {
    onChange({
      ...value,
      extras: (value.extras || []).filter((extra) => extra.id !== id),
    });
  };

  const applyPaLightsUntil1am = () => {
    const existing = (value.extras || []).find((extra) => /pa\s*&?\s*lights/i.test(String(extra?.name || extra?.key || "")));
    const nextFinish = "01:00";
    const nextOffset = 1;

    if (existing) {
      onChange({
        ...value,
        paLightsFinishTime: nextFinish,
        paLightsFinishDayOffset: nextOffset,
        extras: (value.extras || []).map((extra) =>
          extra.id === existing.id
            ? { ...extra, finishTime: nextFinish }
            : extra
        ),
      });
      return;
    }

    onChange({
      ...value,
      paLightsFinishTime: nextFinish,
      paLightsFinishDayOffset: nextOffset,
      extras: [
        ...(value.extras || []),
        {
          id: `extra-${Date.now()}-palights`,
          key: "pa_and_lights_hire",
          name: "PA & Lights Hire",
          quantity: 1,
          price: 0,
          finishTime: nextFinish,
          arrivalTime: value.arrivalTime || "",
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Update booking</h2>
            <div className="text-sm text-gray-600 mt-1">
              {value.clientFirstNames || "—"} • {value.bookingRef || "—"} • {value.actTscName || value.actName || "—"}
            </div>
          </div>
          <button className="px-3 py-2 border rounded" onClick={onClose}>Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Client</label>
            <input className="border rounded px-3 py-2 w-full" value={value.clientFirstNames || ""} readOnly />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Booking ref</label>
            <input className="border rounded px-3 py-2 w-full" value={value.bookingRef || ""} readOnly />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Arrival</label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.arrivalTime || ""}
              onChange={(e) => onChange({ ...value, arrivalTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Band finish</label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.finishTime || ""}
              onChange={(e) => onChange({ ...value, finishTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">PA/lights finish</label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.paLightsFinishTime || ""}
              onChange={(e) => onChange({ ...value, paLightsFinishTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">PA/lights next day offset</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={value.paLightsFinishDayOffset || 0}
              onChange={(e) => onChange({ ...value, paLightsFinishDayOffset: Number(e.target.value || 0) })}
            >
              <option value={0}>Same day</option>
              <option value={1}>Next day</option>
            </select>
          </div>
        </div>

        <div className="mb-5 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="font-medium">Extras</h3>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="px-3 py-2 border rounded bg-white" onClick={() => addExtra()}>+ Add manual extra</button>
              <button type="button" className="px-3 py-2 border rounded bg-white" onClick={applyPaLightsUntil1am}>+ Add PA & lights until 1am</button>
            </div>
          </div>

          {likelyExtras.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-600 mb-2">Likely extras from this band's roles</div>
              <div className="flex gap-2 flex-wrap">
                {likelyExtras.map((extra, idx) => (
                  <button
                    key={`${extra.key}-${idx}`}
                    type="button"
                    className="px-3 py-2 border rounded bg-white text-sm"
                    onClick={() => addExtra(extra)}
                  >
                    Add {extra.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(value.extras || []).length === 0 && (
              <div className="text-sm text-gray-500">No extras added yet.</div>
            )}

            {(value.extras || []).map((extra) => (
              <div key={extra.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-lg p-3 bg-white">
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">Extra name</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={extra.name || ""}
                    onChange={(e) => updateExtra(extra.id, { name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Key</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={extra.key || ""}
                    onChange={(e) => updateExtra(extra.id, { key: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.quantity ?? 1}
                    onChange={(e) => updateExtra(extra.id, { quantity: Number(e.target.value || 1) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Price (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.price ?? 0}
                    onChange={(e) => updateExtra(extra.id, { price: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Arrival</label>
                  <input
                    type="time"
                    step="300"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.arrivalTime || ""}
                    onChange={(e) => updateExtra(extra.id, { arrivalTime: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Finish</label>
                  <input
                    type="time"
                    step="300"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.finishTime || ""}
                    onChange={(e) => updateExtra(extra.id, { finishTime: e.target.value })}
                  />
                </div>
                <div className="md:col-span-12 flex justify-end">
                  <button type="button" className="text-sm underline text-red-600" onClick={() => removeExtra(extra.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="font-medium mb-3">Optional manual adjustment</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Label</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={value.manualAdjustmentLabel || ""}
                  onChange={(e) => onChange({ ...value, manualAdjustmentLabel: e.target.value })}
                  placeholder="e.g. goodwill discount or manual hire fee"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-3 py-2 w-full"
                  value={value.manualAdjustmentAmount || ""}
                  onChange={(e) => onChange({ ...value, manualAdjustmentAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="font-medium mb-3">Updated totals preview</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Current/base gross</span><strong>£{Number(value.baseGross || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
              <div className="flex items-center justify-between"><span>Extras total</span><strong>£{Number(extrasTotal || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
              <div className="flex items-center justify-between"><span>Manual adjustment</span><strong>£{Number(manualAdjustmentAmount || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
              <div className="flex items-center justify-between border-t pt-2"><span>New gross total</span><strong>£{Number(recalculatedGross || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
              <div className="flex items-center justify-between"><span>Deposit already paid</span><strong>£{Number(value.depositAmount || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
              <div className="flex items-center justify-between"><span>Estimated new balance</span><strong>£{Number(recalculatedBalance || 0).toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={onClose}>Cancel</button>
          <button type="button" className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save booking update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Agent selector (dropdown + "Other...")
const AGENTS = [
  "Alive Network",
  "Direct",
  "Encore",
  "Entertainment Nation",
  "Freak Music",
  "Function Central",
  "LMM",
  "Poptop",
  "Scarlettte",
  "Silk Street",
  "Staar Productions",
  "Warble",
  "Wedding Jam",
  "Other",
].sort((a, b) => a.localeCompare(b));

function AgentCell({ value, onSave }) {
  const [mode, setMode] = useState(() => (value && !AGENTS.includes(value) ? "Other" : (value || "")));
  const [text, setText] = useState(() => (value && !AGENTS.includes(value) ? value : ""));

  useEffect(() => {
    const isOther = value && !AGENTS.includes(value);
    setMode(isOther ? "Other" : (value || ""));
    setText(isOther ? value : "");
  }, [value]);

  const commit = (nextVal) => {
    if (!nextVal) return;
    onSave(nextVal);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1 w-44"
        value={mode}
        onChange={(e) => {
          const v = e.target.value;
          setMode(v);
          if (v !== "Other") commit(v);
        }}
      >
        <option value="">—</option>
        {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      {mode === "Other" && (
        <input
          className="border rounded px-2 py-1 w-48"
          placeholder="Type agent name…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text && commit(text.trim())}
        />
      )}
    </div>
  );
}

export default function BookingBoard() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  // sorting ui state
  const [sortBy, setSortBy] = useState("eventDateISO"); // eventDateISO | clientFirstNames | createdAt
  const [sortDir, setSortDir] = useState("asc");        // asc | desc

  // manual add row
const [newRow, setNewRow] = useState({
  bookerName: "",        // NEW
  clientFirstNames: "",  // already there
  bookingRef: "",
  eventDateISO: "",
  enquiryDateISO: "",
  bookingDateISO: "",
  agent: "Direct",
  clientEmail: "",
  actName: "",
  actTscName: "",
  address: "",
  county: "",
  grossValue: "",
  lineupSelected: "",
  arrivalTime: "",
  finishTime: "",        // already added earlier
});
  const [adding, setAdding] = useState(false);
  const [hideInternalTests, setHideInternalTests] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const buildHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

  const fetchRows = async () => {
    const url = `${API_BASE}/board/bookings?q=${encodeURIComponent(q)}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
    try {
      const res = await fetch(url, { headers: buildHeaders(), credentials: "include" });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(json.rows || []);
      else setRows([]);
    } catch (e) {
      console.error("Board load failed", e);
      setRows([]);
    }
  };

  useEffect(() => { fetchRows(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchRows(); /* when sort changes */ }, [sortBy, sortDir]);

  const mergedRows = useMemo(() => {
  const map = new Map();

  for (const row of rows) {
    const key = getMergeKey(row);
    const existing = map.get(key);
    map.set(key, chooseBetterRow(existing, row));
  }

  return [...map.values()];
}, [rows]);

  const onInlineEdit = async (id, patch) => {
    const url = `${API_BASE}/board/bookings/${id}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(prev => prev.map(r => (r._id === id ? json.row : r)));
    } catch (e) {
      console.error("PATCH failed", e);
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setEditForm(buildEditStateFromRow(row));
  };

  const saveBookingUpdate = async () => {
    if (!editingRow || !editForm?._id) return;

    const cleanedExtras = (editForm.extras || [])
      .map((extra) => ({
        key: String(extra?.key || "").trim(),
        name: String(extra?.name || extra?.key || "Extra").trim(),
        quantity: Number(extra?.quantity || 1) || 1,
        price: Number(extra?.price || 0) || 0,
        finishTime: extra?.finishTime || "",
        arrivalTime: extra?.arrivalTime || "",
      }))
      .filter((extra) => extra.name || extra.key || extra.price || extra.finishTime || extra.arrivalTime);

    const extrasTotal = cleanedExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
    const manualAdjustmentAmount = Number(editForm.manualAdjustmentAmount || 0) || 0;
    const newGross = Math.max(0, Number(editForm.baseGross || 0) + extrasTotal + manualAdjustmentAmount);
    const depositAmount = Number(editForm.depositAmount || 0) || 0;
    const newBalance = Math.max(0, newGross - depositAmount);

    const currentActsSummary = Array.isArray(editingRow?.actsSummary) ? editingRow.actsSummary : [];
    const firstAct = currentActsSummary[0] || {};
    const nextPerformance = {
      ...(editingRow?.performanceTimes || {}),
      ...(firstAct?.performance || {}),
      arrivalTime: editForm.arrivalTime || "",
      startTime: editForm.startTime || firstAct?.performance?.startTime || editingRow?.performanceTimes?.startTime || "",
      finishTime: editForm.finishTime || "",
      paLightsFinishTime: editForm.paLightsFinishTime || "",
      paLightsFinishDayOffset: Number(editForm.paLightsFinishDayOffset || 0) || 0,
    };

    const patch = {
      totals: {
        ...(editingRow?.totals || {}),
        fullAmount: Number(newGross.toFixed(2)),
        depositAmount: Number(depositAmount.toFixed(2)),
      },
      amount: Number((editingRow?.amount || editingRow?.totals?.chargedAmount || 0)),
      fee: Number(newGross.toFixed(2)),
      balanceAmountPence: Math.round(newBalance * 100),
      performanceTimes: nextPerformance,
      bookingDetails: {
        ...(editingRow?.bookingDetails || {}),
        extras: cleanedExtras,
      },
      notes: [
        editingRow?.notes || "",
        editForm.manualAdjustmentLabel && manualAdjustmentAmount
          ? `Manual adjustment: ${editForm.manualAdjustmentLabel} (£${manualAdjustmentAmount.toFixed(2)})`
          : "",
      ].filter(Boolean).join("\n"),
      actsSummary: currentActsSummary.length
        ? currentActsSummary.map((act, index) => {
            if (index !== 0) return act;
            return {
              ...act,
              selectedExtras: cleanedExtras,
              performance: {
                ...(act?.performance || {}),
                ...nextPerformance,
              },
            };
          })
        : currentActsSummary,
    };

    try {
      setSavingEdit(true);
      const res = await fetch(`${API_BASE}/board/bookings/${editForm._id}`, {
        method: "PATCH",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success && json?.row) {
        setRows((prev) => prev.map((row) => (row._id === json.row._id ? json.row : row)));
        setEditingRow(null);
        setEditForm(null);
      } else {
        window.alert("Booking update could not be saved.");
      }
    } catch (error) {
      console.error("save booking update failed", error);
      window.alert("Booking update failed.");
    } finally {
      setSavingEdit(false);
    }
  };

  const money = (n) => `£${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  // --- Helpers for deposit, band size, booking details summary ---
  const calcDeposit = (gross) => {
    if (!gross) return null;
    const n = Math.ceil((Number(gross) - 50) * 0.2) + 50;
    return n > 0 ? n : null;
  };

const extractBandSize = (row) => {
  if (Number(row?.bandSize)) return Number(row.bandSize);
  if (Number(row?.actsSummary?.[0]?.bandSize)) return Number(row.actsSummary[0].bandSize);

  const lineupLabel = String(
    row?.lineupSelected ||
    row?.actsSummary?.[0]?.lineupLabel ||
    row?.actsSummary?.[0]?.lineup?.actSize ||
    ""
  );

  const m = lineupLabel.match(/(\d+)\s*[- ]?\s*piece/i);
  return m ? Number(m[1]) : 0;
};

const summariseBookingDetails = (bd = {}, row) => {
  const bits = [];

  if (bd?.ceremony?.start || bd?.ceremony?.end) {
    bits.push(`Ceremony ${bd.ceremony.start || "?"}–${bd.ceremony.end || "?"}`);
  }

  if (bd?.afternoon?.start || bd?.afternoon?.end) {
    bits.push(`Afternoon ${bd.afternoon.start || "?"}–${bd.afternoon.end || "?"}`);
  }

  if (Array.isArray(bd?.evening?.sets) && bd.evening.sets.length) {
    bits.push(`Evening ${bd.evening.sets.map(s => `${s.start || "?"}–${s.end || "?"}`).join(", ")}`);
  }

  if (bd?.djServicesBooked) bits.push("DJ booked");

  const extras = Array.isArray(bd?.extras)
    ? bd.extras
    : Array.isArray(row?.actsSummary?.[0]?.selectedExtras)
      ? row.actsSummary[0].selectedExtras
      : [];

  if (extras.length) {
    const extrasLabel = extras
      .map((extra) => {
        const qty = Number(extra?.quantity || 1) || 1;
        const price = Number(extra?.price || 0) || 0;
        const finish = extra?.finishTime ? ` until ${extra.finishTime}` : "";
        return `${qty > 1 ? `${qty}x ` : ""}${extra?.name || extra?.key || "Extra"}${finish}${price ? ` (£${price})` : ""}`;
      })
      .join(", ");

    if (extrasLabel) bits.push(`Extras: ${extrasLabel}`);
  }

  const perf = row?.performanceTimes || row?.actsSummary?.[0]?.performance || {};
  if (perf?.startTime || perf?.finishTime) {
    bits.push(`Performance ${perf.startTime || "?"}–${perf.finishTime || "?"}`);
  }

  const venueName = row?.eventSheet?.answers?.venue_name || row?.venue || "";
  if (venueName) bits.push(venueName);

  const firstSec = summariseEventSheetFirstSection(row);
  if (firstSec) bits.unshift(firstSec);

  return bits.join(" • ");
};

  const postManualRow = async () => {
    try {
      const payload = {
        ...newRow,
        clientEmails: newRow.clientEmail ? [{ email: newRow.clientEmail }] : [],
        grossValue: Number(newRow.grossValue || 0) || 0,
        bookingDetails: {},
        allocation: { status: "in_progress" },
        review: { requestedCount: 0, received: false },
        source: "manual",
        enquiryDateISO: newRow.enquiryDateISO || "",  // optional
        bookingDateISO: newRow.bookingDateISO || "",  // optional
        arrivalTime: newRow.arrivalTime || "",
        finishTime: newRow.finishTime || "",
      };
      const res = await fetch(`${API_BASE}/board/bookings`, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) {
        setRows(r => [...r, json.row]);
        setAdding(false);
        setNewRow({
          bookerName: "",
          clientFirstNames: "",
          bookingRef: "",
          eventDateISO: "",
          agent: "Direct",
          clientEmail: "",
          actName: "",
          actTscName: "",
          address: "",
          county: "",
          grossValue: "",
          lineupSelected: "",
          arrivalTime: "",
          finishTime: "",
          enquiryDateISO: "",
          bookingDateISO: "",
        });
      }
    } catch (e) {
      console.error("manual add failed", e);
    }
  };

  return (
    <div className="p-4">
      {/* Search + Sort */}
      <div className="flex gap-3 items-center mb-4 flex-wrap sticky top-0 z-20 bg-white pb-3">
        <input
          className="border rounded px-3 py-2 w-full max-w-xl"
          placeholder="Search name, ref, act, county…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchRows()}
        />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={fetchRows}>
          Search
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600">Sort by</span>
          <select
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="eventDateISO">Event date</option>
            <option value="clientFirstNames">Client name</option>
            <option value="createdAt">Booking date</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 ml-2">
            <input
              type="checkbox"
              checked={hideInternalTests}
              onChange={(e) => setHideInternalTests(e.target.checked)}
            />
            Hide internal tests
          </label>
          <button
            className="px-4 py-2 rounded border hover:bg-gray-100"
            onClick={() => setAdding((prev) => !prev)}
          >
            {adding ? "Close manual entry" : "+ Add manual entry"}
          </button>
        </div>
      </div>

      <div className="overflow-auto border rounded max-h-[calc(100vh-170px)]">
        <table className="min-w-[2100px] w-full text-sm">
          <colgroup>
            <col style={{ width: 140 }} />  {/* First names */}
            <col style={{ width: 160 }} />  {/* Ref */}
            <col style={{ width: 110 }} />  {/* Event Sheet */}
            <col style={{ width: 110 }} />  {/* Contract */}
            <col style={{ width: 150 }} />  {/* Enquiry Date */}
            <col style={{ width: 150 }} />  {/* Booking Date */}
            <col style={{ width: 150 }} />  {/* Event Date */}
            <col style={{ width: 110 }} />  {/* Gross */}
            <col style={{ width: 110 }} />  {/* Deposit */}
            <col style={{ width: 110 }} />  {/* Balance */}
            <col style={{ width: 230 }} />  {/* Agent */}
            <col style={{ width: 260 }} />  {/* Client Emails */}
            <col style={{ width: 120 }} />  {/* Event Type */}
            <col style={{ width: 150 }} />  {/* Act */}
            <col style={{ width: 150 }} />  {/* Act tscName */}
            <col style={{ width: 320 }} />  {/* Address */}
            <col style={{ width: 110 }} />  {/* County */}
            <col style={{ width: 110 }} />  {/* Band Size */}
            <col style={{ width: 200 }} />  {/* Lineup */}
            <col style={{ width: 120 }} />  {/* Arrival */}
            <col style={{ width: 260 }} />  {/* Booking details */}
            <col style={{ width: 80 }} />   {/* DJ */}
            <col style={{ width: 140 }} />  {/* Allocated */}
            <col style={{ width: 140 }} />  {/* Review */}
            <col style={{ width: 120 }} />  {/* Balance Paid */}
            <col style={{ width: 120 }} />  {/* Band Paid */}
            <col style={{ width: 130 }} />  {/* Actions */}
          </colgroup>

          <thead className="bg-gray-50 text-left sticky top-0 z-10">
            <tr>
              {[
                "First names","Ref","Event Sheet","Contract","Enquiry Date","Booking Date","Event Date","Gross","Deposit","Balance",
                "Agent","Client Emails","Event Type","Act","Act tscName","Address","County","Band Size","Lineup","Booking times","Booking details","DJ",
                "Allocated","Review","Balance Paid","Band Paid","Actions"
              ].map((h) => (
                <th key={h} className="px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
           {mergedRows
  .filter((r) => (hideInternalTests ? !isInternalTestBooking(r) : true))
  .map((r) => {
              const clientFirstNames = getClientFirstNames(r);
              const bookingRef = getDisplayBookingRef(r);
              const eventDate = getDisplayEventDate(r);
              const gross = getDisplayGross(r);
              const depositFromBackend = getDisplayDeposit(r);
              const deposit = depositFromBackend != null ? depositFromBackend : calcDeposit(gross);
              const balance = gross ? Math.max(0, Math.round(gross - (deposit || 0))) : null;
const fallbackEventSheetUrl = `${PUBLIC_SITE_BASE}/event-sheet/${encodeURIComponent(bookingRef || "")}`;              const contractUrl = r?.contractUrl || r?.pdfUrl || (r?.contract && (r.contract.url || r.contract.href)) || "";
              const normalizedContractUrl = normalizeUrl(contractUrl);
              const actName = getDisplayActName(r);
              const actTsc = getDisplayActTscName(r);
              const address = getDisplayAddress(r);
              const county = getDisplayCounty(r);
              const arrivalTime = getDisplayArrivalTime(r);
              const finishTime = getDisplayFinishTime(r);
              const clientEmails = getDisplayClientEmails(r);
              const performanceTimes = r?.performanceTimes || r?.actsSummary?.[0]?.performance || {};
              const balancePaid = Boolean(r?.payments?.balancePaymentReceived ?? r?.balancePaid);
              const bandPaid = Boolean(r?.payments?.bandPaymentsSent ?? r?.bandPaymentsSent);

              return (
                <tr key={r._id} className="odd:bg-white even:bg-gray-50 align-top">
                  <td className="px-3 py-2">{clientFirstNames}</td>
                  <td className="px-3 py-2">{bookingRef}</td>

                  {/* Event Sheet */}
                  <td className="px-3 py-2">
                    {r.eventSheetLink ? (
                      <a className="text-blue-600 underline" href={r.eventSheetLink} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() => {
                          if (!PUBLIC_SITE_BASE || PUBLIC_SITE_BASE.includes("localhost:5174")) {
                            window.alert("Event sheet fallback URL is not configured yet. Please set VITE_PUBLIC_SITE_URL to the live public site URL.");
                            return;
                          }
                          window.open(fallbackEventSheetUrl, "_blank", "noopener,noreferrer");
                        }}
                      >
                        Open
                      </button>
                    )}
                  </td>

                  {/* Contract */}
                  <td className="px-3 py-2">
                    {normalizedContractUrl ? (
                      <a className="text-blue-600 underline" href={normalizedContractUrl} target="_blank" rel="noreferrer">Open</a>
                    ) : "—"}
                  </td>

                  <td className="px-3 py-2">{fmtShort(r.enquiryDateISO || r.createdAt)}</td>
                  <td className="px-3 py-2">{fmtShort(r.bookingDateISO || r.createdAt)}</td>
                  <td className="px-3 py-2">{fmtOrdinal(eventDate)}</td>
                  <td className="px-3 py-2">{gross ? money(gross) : "—"}</td>
                  <td className="px-3 py-2">{deposit != null ? money(deposit) : "—"}</td>
                  <td className="px-3 py-2">{balance != null ? money(balance) : "—"}</td>
                  <td className="px-3 py-2">
                    <AgentCell value={r.agent || "Direct"} onSave={(val) => onInlineEdit(r._id, { agent: val })}/>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {clientEmails.map((e, i) => (
                        <Tag key={i}>{e.label ? `${e.label}: ` : ""}{e.email}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.eventType || "—"}</td>
                  <td className="px-3 py-2">{actName || "—"}</td>
                  <td className="px-3 py-2">{actTsc || "—"}</td>
                  <td className="px-3 py-2">{address || "—"}</td>
                  <td className="px-3 py-2">{county || "—"}</td>
                  <td className="px-3 py-2">{extractBandSize(r)}</td>
                  <td className="px-3 py-2">{buildFullLineup(r) || "—"}</td>
                  <td className="px-3 py-2">
                    {performanceTimes?.startTime || performanceTimes?.finishTime || performanceTimes?.paLightsFinishTime
                      ? [
                          performanceTimes.startTime,
                          performanceTimes.finishTime,
                          performanceTimes.paLightsFinishTime ? `PA/lights until ${performanceTimes.paLightsFinishTime}${performanceTimes?.paLightsFinishDayOffset ? " (+1)" : ""}` : "",
                        ].filter(Boolean).join(" • ")
                      : arrivalTime || finishTime
                        ? [arrivalTime, finishTime].filter(Boolean).join("–")
                        : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs leading-5">{summariseBookingDetails(r.bookingDetails, r)}</div>
                  </td>
                  <td className="px-3 py-2">{r.bookingDetails?.djServicesBooked ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    {r.allocation?.status === "fully_allocated" ? <Tag>✅ Allocated</Tag> :
                     r.allocation?.status === "gap" ? <Tag>⚠️ Gap</Tag> :
                     r.allocation?.status === "in_progress" ? <Tag>⏳ In progress</Tag> :
                     <Tag>—</Tag>}
                  </td>
                  <td className="px-3 py-2">
                    {r.review?.received ? (
                      <Tag>⭐ Received</Tag>
                    ) : (
                      <button
                        className="text-xs underline"
                        onClick={() =>
                          onInlineEdit(r._id, {
                            review: {
                              ...(r.review || {}),
                              requestedCount: (r.review?.requestedCount || 0) + 1,
                              lastRequestedAt: new Date().toISOString(),
                            },
                          })
                        }
                      >
                        Send request
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {balancePaid ? (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Paid</span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {bandPaid ? (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Paid</span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="px-3 py-1.5 border rounded hover:bg-gray-100"
                      onClick={() => openEditModal(r)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}

{adding && (
  <tr className="bg-yellow-50 sticky top-[49px] z-[5]">
    <td colSpan={999} className="px-3 py-3 border-b border-yellow-200">
      <div className="flex flex-col gap-3">
        {/* Row 1: core id + dates */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 w-56"
            placeholder="Booker full name"
            value={newRow.bookerName}
            onChange={e => setNewRow(v => ({ ...v, bookerName: e.target.value }))}
          />

          <input
            className="border rounded px-2 py-1 w-56"
            placeholder="Client first names"
            value={newRow.clientFirstNames}
            onChange={e => setNewRow(v => ({ ...v, clientFirstNames: e.target.value }))}
          />
          <input
            className="border rounded px-2 py-1 w-40"
            placeholder="Ref"
            value={newRow.bookingRef}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, bookingRef: e.target.value }))
            }
          />
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Event date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.eventDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, eventDateISO: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Enquiry date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.enquiryDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, enquiryDateISO: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Booking date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.bookingDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, bookingDateISO: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Row 2: agent + contact + money */}
        <div className="flex flex-wrap gap-2 items-end">
          <select
            className="border rounded px-2 py-1 w-48"
            value={newRow.agent}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, agent: e.target.value }))
            }
          >
            {AGENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1 w-56"
            placeholder="Client email"
            value={newRow.clientEmail}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, clientEmail: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="Gross"
            value={newRow.grossValue}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, grossValue: e.target.value }))
            }
          />
        </div>

        {/* Row 3: lineup + times */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Lineup label</label>
            <input
              className="border rounded px-2 py-1 w-56"
              placeholder="e.g., 4-Piece"
              value={newRow.lineupSelected}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, lineupSelected: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Arrival time</label>
            <input
              type="time"
              className="border rounded px-2 py-1 w-36"
              step="300"
              value={newRow.arrivalTime}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, arrivalTime: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Finish time</label>
            <input
              type="time"
              className="border rounded px-2 py-1 w-36"
              step="300"
              value={newRow.finishTime}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, finishTime: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Row 4: act names */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 w-48"
            placeholder="Act"
            value={newRow.actName}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, actName: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-48"
            placeholder="Act tscName"
            value={newRow.actTscName}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, actTscName: e.target.value }))
            }
          />
        </div>

        {/* Row 5: address */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 w-72"
            placeholder="Address"
            value={newRow.address}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, address: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-44"
            placeholder="County"
            value={newRow.county}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, county: e.target.value }))
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button className="px-3 py-2 bg-black text-white rounded" onClick={postManualRow}>
            Save
          </button>
          <button className="px-3 py-2 border rounded" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      </div>
    </td>
  </tr>
)}

{mergedRows.filter((r) => (hideInternalTests ? !isInternalTestBooking(r) : true)).length === 0 && (              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={27}>
                  No rows yet.
                  <div className="text-xs mt-2">
                    API: {API_BASE}/board/bookings • token: {getAuthToken() ? "found" : "missing"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRow && editForm && (
        <BookingUpdateModal
          row={editingRow}
          value={editForm}
          onChange={setEditForm}
          onClose={() => {
            setEditingRow(null);
            setEditForm(null);
          }}
          onSave={saveBookingUpdate}
          saving={savingEdit}
        />
      )}
    </div>
  );
}