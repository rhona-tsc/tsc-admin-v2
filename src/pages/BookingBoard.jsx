// admin/src/pages/BookingBoard.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = (
  import.meta?.env?.VITE_ADMIN_API_BASE ||
  (import.meta?.env?.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : "") ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

// Where to send someone if there’s no eventSheetLink on the row
const PUBLIC_SITE_BASE = (
  import.meta?.env?.VITE_PUBLIC_SITE_URL || "http://localhost:5174"
).replace(/\/$/, "");
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

  const p1 = [
    row?.eventSheet?.answers?.partner1_first,
    row?.eventSheet?.answers?.partner1_last,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const p2 = [
    row?.eventSheet?.answers?.partner2_first,
    row?.eventSheet?.answers?.partner2_last,
  ]
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
  return (
    row?.eventDateISO || row?.date || row?.eventDate || row?.bookingDate || ""
  );
};

const getDisplayGross = (row) => {
  return Number(
    row?.grossValue ||
      row?.totals?.fullAmount ||
      row?.quote?.total ||
      row?.pricing?.total ||
      row?.amount ||
      row?.fee ||
      0,
  );
};

const normaliseAgent = (value = "") =>
  String(value || "").trim().toLowerCase();

const DEPOSIT_AGENTS = new Set([
  "direct",
  "bmm",
  "tsc",
  "weddingjam",
  "wedding jam",
  "staar productions",
  "encore",
]);

const agentTakesDeposit = (row) => {
  const agent = normaliseAgent(row?.agent || row?.source);
  return DEPOSIT_AGENTS.has(agent);
};

const getDisplayDeposit = (row) => {
  if (!agentTakesDeposit(row)) return 0;

  const backendDeposit = Number(
    row?.payments?.depositChargedAmount ??
      row?.payments?.depositAmount ??
      row?.totals?.depositAmount ??
      row?.quote?.deposit ??
      row?.pricing?.deposit ??
      row?.depositAmount ??
      0,
  );

  return backendDeposit > 0 ? backendDeposit : null;
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const clamp0 = (n) => Math.max(0, Number(n || 0) || 0);

const vatSplitFromGross = (gross, vatRate = 0.2) => {
  const g = Number(gross || 0) || 0;
  const r = Number(vatRate ?? 0.2);
  const vat = round2(g * (r / (1 + r)));
  const net = round2(g - vat);
  return { vat, net };
};

const calcVatFromVatInclusiveGross = (gross, vatRate = 0.2) => {
  const g = clamp0(gross);
  const r = Number(vatRate ?? 0.2);
  const vat = Math.round(g * (r / (1 + r)) * 100) / 100;
  const net = Math.round((g - vat) * 100) / 100;
  return { vat, net };
};

// Single source of truth for accounting split across table + modal
const getAccountingSplit = (row, gross, deposit) => {
  const acc =
    row?.accounting ||
    row?.booking?.accounting ||
    row?.totals?.accounting ||
    row?.payments?.accounting ||
    null;

  const vatRate = Number(acc?.vatRate ?? 0.2);
  const commissionGross = Number(acc?.commissionGross ?? 0) || 0;
  const commissionVat = Number(acc?.commissionVat ?? 0) || 0;
  const commissionNet = Number(acc?.commissionNet ?? 0) || 0;
  const passThroughGross = Number(acc?.passThroughGross ?? 0) || 0;

  // If backend has split, trust it.
  if (commissionGross > 0 || passThroughGross > 0) {
    return {
      vatRate,
      commissionGross: round2(commissionGross),
      commissionVat: round2(commissionVat),
      commissionNet: round2(commissionNet),
      passThroughGross: round2(passThroughGross),
      hasAccounting: true,
      source: "booking.accounting",
    };
  }

  // Fallback: commission ~= deposit, pass-through ~= gross - commission
  const g = Number(gross || 0) || 0;
  const d = Number(deposit || 0) || 0;

  const fallbackCommissionGross = d > 0 ? d : 0;
  const fallbackPassThroughGross = Math.max(
    0,
    round2(g - fallbackCommissionGross),
  );

  const split = vatSplitFromGross(fallbackCommissionGross, vatRate);

  return {
    vatRate,
    commissionGross: round2(fallbackCommissionGross),
    commissionVat: round2(split.vat),
    commissionNet: round2(split.net),
    passThroughGross: round2(fallbackPassThroughGross),
    hasAccounting: false,
    source: "fallback",
  };
};

const fmtMoney0 = (n) =>
  `£${Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

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
  const raw =
    row?.actTscName ||
    row?.tscName ||
    row?.actsSummary?.[0]?.tscName ||
    row?.act?.tscName ||
    row?.selectedAct?.tscName ||
    row?.actsSummary?.[0]?.name ||
    row?.act?.name ||
    row?.selectedAct?.name ||
    "";

  const override =
    ACT_TSC_NAME_OVERRIDES[
      String(raw || "")
        .trim()
        .toLowerCase()
    ];
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
  if (row?.eventSheet?.answers?.venue_county)
    return row.eventSheet.answers.venue_county;

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
  if (Array.isArray(row?.clientEmails) && row.clientEmails.length)
    return row.clientEmails;
  const email = getPrimaryEmail(row);
  return email ? [{ email }] : [];
};

const hasContractLink = (row) => {
  const contractUrl =
    row?.contractUrl ||
    row?.pdfUrl ||
    (row?.contract && (row.contract.url || row.contract.href)) ||
    "";
  return Boolean(normalizeUrl(contractUrl));
};

const getPrimaryActKey = (row) => {
  return String(getDisplayActTscName(row) || getDisplayActName(row) || "")
    .trim()
    .toLowerCase();
};

const getMergeKey = (row) => {
  const bookingRef = String(getDisplayBookingRef(row) || "")
    .trim()
    .toLowerCase();
  if (bookingRef) return `ref:${bookingRef}`;

  const email = String(getPrimaryEmail(row) || "")
    .trim()
    .toLowerCase();
  const eventDate = String(getDisplayEventDate(row) || "").slice(0, 10);
  const actKey = getPrimaryActKey(row);
  const names = String(getClientFirstNames(row) || "")
    .trim()
    .toLowerCase();

  return `fallback:${email}|${eventDate}|${actKey}|${names}`;
};

const chooseBetterRow = (current, incoming) => {
  if (!current) return incoming;
  if (!incoming) return current;

  const currentHasContract = hasContractLink(current);
  const incomingHasContract = hasContractLink(incoming);

  if (incomingHasContract && !currentHasContract)
    return { ...current, ...incoming };
  if (currentHasContract && !incomingHasContract)
    return { ...incoming, ...current };

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
    Boolean(
      incoming?.lineupSelected || incoming?.actsSummary?.[0]?.lineupLabel,
    ),
  ].filter(Boolean).length;

  if (incomingScore > currentScore) return { ...current, ...incoming };
  if (currentScore > incomingScore) return { ...incoming, ...current };

  const currentUpdated =
    new Date(current?.updatedAt || current?.createdAt || 0).getTime() || 0;
  const incomingUpdated =
    new Date(incoming?.updatedAt || incoming?.createdAt || 0).getTime() || 0;

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
  const j = day % 10,
    k = day % 100;
  const suffix =
    j === 1 && k !== 11
      ? "st"
      : j === 2 && k !== 12
        ? "nd"
        : j === 3 && k !== 13
          ? "rd"
          : "th";
  return d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(String(day), `${day}${suffix}`);
};
const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d)
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
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

const getPaymentUrl = (row) => {
  const raw =
    // Stripe hosted invoice / balance links (preferred)
    row?.payments?.balanceInvoiceUrl ||
    row?.payments?.hosted_invoice_url ||
    row?.balanceInvoiceUrl ||
    // Generic invoice hosted URL
    row?.payments?.invoiceUrl ||
    row?.invoiceUrl ||
    // Legacy / manual
    row?.paymentLink ||
    row?.checkoutUrl ||
    row?.stripeCheckoutUrl ||
    row?.payments?.checkoutUrl ||
    row?.payments?.paymentLink ||
    "";

  return normalizeUrl(raw);
};

const getInvoiceUrl = (row) => {
  const hasBoardInvoice =
    row?.invoicePdfUrl ||
    row?.invoiceUrl ||
    row?.payments?.boardInvoicePdfUrl;

  if (row?._id && hasBoardInvoice) {
    return `${API_BASE}/invoices/board-invoice/${row._id}`;
  }

  const raw =
    row?.payments?.balanceInvoicePdfUrl ||
    row?.payments?.invoice_pdf ||
    row?.balanceInvoicePdfUrl ||
    row?.invoicePdfUrl ||
    row?.invoiceUrl ||
    row?.invoice?.pdfUrl ||
    row?.invoice?.url ||
    "";

  return normalizeUrl(raw);
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
    .map((x) => (typeof x === "string" ? x : x?.name || x?.key || ""))
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const hasSoundEng =
    /sound\s*eng/i.test(namesFromExtras.join(" ")) ||
    row?.services?.soundEngineering ||
    row?.bookingDetails?.soundEngineeringBooked ||
    row?.actsSummary?.[0]?.bandMembers?.some?.(
      (m) =>
        Array.isArray(m?.additionalRoles) &&
        m.additionalRoles.some((r) =>
          /sound\s*eng/i.test(String(r?.role || "")),
        ),
    ) ||
    row?.actsSummary?.[0]?.lineup?.bandMembers?.some?.(
      (m) =>
        Array.isArray(m?.additionalRoles) &&
        m.additionalRoles.some((r) =>
          /sound\s*eng/i.test(String(r?.role || "")),
        ),
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
  <span className="inline-block px-2 py-1 text-xs rounded border">
    {children}
  </span>
);

const cellClass = "px-2 py-1 whitespace-nowrap align-middle";

const inputClass =
  "w-full min-w-[120px] rounded border border-gray-300 bg-white px-2 py-1 text-xs whitespace-nowrap";


  const stickyCol1 = "sticky left-0 z-20 bg-white";
const stickyCol2 = "sticky left-[140px] z-20 bg-white";
const stickyHead1 = "sticky left-0 top-0 z-40 bg-gray-50";
const stickyHead2 = "sticky left-[140px] top-0 z-40 bg-gray-50";

function InlineInput({
  value = "",
  placeholder = "",
  className = "",
  onCommit,
  onChange,
  type = "text",
  readOnly = false,
}) {
  const [v, setV] = useState(value || "");

  useEffect(() => {
    setV(value || "");
  }, [value]);

  const editable = typeof onCommit === "function" || typeof onChange === "function";

  return (
    <input
      type={type}
      step={type === "time" ? 300 : undefined}
      placeholder={placeholder}
      value={v}
      readOnly={readOnly || !editable}
      className={`${inputClass} ${
        editable ? "bg-white text-gray-900" : "bg-gray-50 text-gray-600"
      } ${className}`}
      onChange={(e) => {
        setV(e.target.value);
        if (onChange) onChange(e);
      }}
      onBlur={() => {
        if (!onCommit) return;
        const next = String(v || "").trim();
        const prev = String(value || "").trim();
        if (next !== prev) onCommit(next);
      }}
    />
  );
}

function ReadOnlyInput({
  value,
  placeholder,
  className = "",
  onCommit,
  type = "text",
}) {
  const [v, setV] = useState(value || "");

  useEffect(() => {
    setV(value || "");
  }, [value]);

  return (
    <input
      type={type}
      step={type === "time" ? 300 : undefined}
      className={`${inputClass} ${className}`}
      placeholder={placeholder}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const next = String(v || "").trim();
        const prev = String(value || "").trim();
        if (next !== prev) onCommit(next);
      }}
    />
  );
}

const isValidObjectIdString = (value) =>
  /^[a-f\d]{24}$/i.test(String(value || "").trim());

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
      category: extra?.category || "",
      pricingMode: extra?.pricingMode || "flat",
      appliedMinutes: Number(extra?.appliedMinutes || 0) || 0,
      billableMemberCount: Number(extra?.billableMemberCount || 0) || 0,
      payoutMemberIds: Array.isArray(extra?.payoutMemberIds)
        ? extra.payoutMemberIds.map((id) => String(id))
        : [],
      payoutMemberNames: Array.isArray(extra?.payoutMemberNames)
        ? extra.payoutMemberNames
        : [],
      paLateStay: extra?.paLateStay || null,
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
      category: extra?.category || "",
      pricingMode: extra?.pricingMode || "flat",
      appliedMinutes: Number(extra?.appliedMinutes || 0) || 0,
      billableMemberCount: Number(extra?.billableMemberCount || 0) || 0,
      payoutMemberIds: Array.isArray(extra?.payoutMemberIds)
        ? extra.payoutMemberIds.map((id) => String(id))
        : [],
      payoutMemberNames: Array.isArray(extra?.payoutMemberNames)
        ? extra.payoutMemberNames
        : [],
      paLateStay: extra?.paLateStay || null,
    }));
  }

  return [];
};

const getExtraConfigFromAnyShape = (extrasSource, key) => {
  if (!extrasSource || !key) return null;

  if (typeof extrasSource?.get === "function") {
    const value = extrasSource.get(key);
    if (value == null) return null;
    return typeof value === "number"
      ? { price: value, complimentary: false }
      : value;
  }

  if (typeof extrasSource === "object" && !Array.isArray(extrasSource)) {
    const value = extrasSource[key];
    if (value == null) return null;
    return typeof value === "number"
      ? { price: value, complimentary: false }
      : value;
  }

  return null;
};

const getActExtrasCatalog = (row) => {
  return (
    row?.actData?.extras ||
    row?.act?.extras ||
    row?.selectedAct?.extras ||
    row?.actsSummary?.[0]?.actData?.extras ||
    row?.actsSummary?.[0]?.act?.extras ||
    null
  );
};

const getPerformerCountForLateFees = (row) => {
  const members =
    row?.actsSummary?.[0]?.lineup?.bandMembers ||
    row?.actsSummary?.[0]?.bandMembers ||
    [];

  const nonManagers = members.filter((member) => {
    const instrument = String(member?.instrument || "");
    const roles = Array.isArray(member?.additionalRoles)
      ? member.additionalRoles
      : [];
    const looksManager =
      /manager|management/i.test(instrument) ||
      roles.some((r) => /manager|management/i.test(String(r?.role || "")));
    return !looksManager;
  });

  return nonManagers.length || members.length || 0;
};

const getLineupMemberOptions = (row) => {
  const members =
    row?.actsSummary?.[0]?.lineup?.bandMembers ||
    row?.actsSummary?.[0]?.bandMembers ||
    [];

  return members.map((member, index) => {
    const rawId = member?.musicianId || member?._id || member?.id || "";

    const persistableId = isValidObjectIdString(rawId) ? String(rawId) : "";
    const fallbackId = `${member?.firstName || "member"}-${member?.lastName || ""}-${index}`;
    const id = persistableId || fallbackId;

    const name =
      [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim() ||
      member?.name ||
      `Member ${index + 1}`;

    const role = member?.instrument || member?.role || "";

    return {
      id,
      persistableId,
      name,
      role,
      label: role ? `${name} — ${role}` : name,
    };
  });
};

const getBandExtraOptions = (row) => {
  const extrasCatalog = getActExtrasCatalog(row);
  const performerCount = getPerformerCountForLateFees(row);
  const basePerformance =
    row?.actsSummary?.[0]?.performance || row?.performanceTimes || {};

  const paOption = {
    key: "pa_and_lights_hire",
    name: "PA & Lights Hire",
    quantity: 1,
    price: 0,
    finishTime: basePerformance?.paLightsFinishTime || "",
    arrivalTime: basePerformance?.arrivalTime || "",
    type: "flat",
  };

  const lateStayConfig = getExtraConfigFromAnyShape(
    extrasCatalog,
    "late_stay_60min_per_band_member",
  );
  const lateStayPricePerHour = Number(lateStayConfig?.price || 0) || 0;
  const lateStayFeeGross =
    lateStayPricePerHour > 0 && performerCount > 0
      ? Math.ceil(lateStayPricePerHour * performerCount * 1.33)
      : 0;

  const options = [
    paOption,
    {
      key: "late_stay_60min_per_band_member",
      name: "Late Stay Fee",
      quantity: 1,
      price: lateStayFeeGross,
      finishTime: "",
      arrivalTime: "",
      type: "late_stay",
      meta: {
        performerCount,
        netPerBandMember: lateStayPricePerHour,
      },
    },
  ];

  const otherKeys = [
    "sound_engineering_for_another_act with your acts PA",
    "wired_mic for speeches",
    "wireless_mic for speeches",
    "background_music_playlist",
    "up_to_3_hours_manned_playlist",
    "up_to_3_hours_band_member_DJ",
    "extra_30min_performance_per_band_member",
    "extra_40min_performance_per_band_member",
    "extra_60min_performance_per_band_member",
    "early_arrival_60min_per_band_member",
    "extra_song_request_per_band_member",
    "speedy_setup (60mins) - roadie and engineer duties only (travel added on top later for additional team member)",
  ];

  otherKeys.forEach((key) => {
    const config = getExtraConfigFromAnyShape(extrasCatalog, key);
    if (!config) return;

    const basePrice = Number(config?.price || 0) || 0;
    const complimentary = Boolean(config?.complimentary);
    const grossPrice = complimentary ? 0 : Math.ceil(basePrice * 1.33);

    options.push({
      key,
      name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      quantity: 1,
      price: grossPrice,
      finishTime: "",
      arrivalTime: "",
      type: "flat",
    });
  });

  return options;
};

const INVOICE_COMPANIES = {
  TSC: {
    label: "The Supreme Collective",
    vatRate: 0,
  },
  BMM: {
    label: "Bamboo Music Management",
    vatRate: 0.2,
  },
};

const buildEditStateFromRow = (row) => {
  const gross = getDisplayGross(row);
  const depositFromBackend = getDisplayDeposit(row);
  const deposit =
    depositFromBackend != null
      ? depositFromBackend
      : agentTakesDeposit(row) && gross
        ? Math.ceil((Number(gross) - 50) * 0.2) + 50
        : 0;

  const performance =
    row?.actsSummary?.[0]?.performance || row?.performanceTimes || {};

  const split = getAccountingSplit(row, gross, depositFromBackend ?? deposit);

  const invoiceCompany = String(
    row?.invoiceCompany || row?.accounting?.invoiceCompany || "TSC",
  ).toUpperCase();

  const defaultVatRate = INVOICE_COMPANIES[invoiceCompany]?.vatRate ?? 0;
  const vatRate = Number(row?.accounting?.vatRate ?? defaultVatRate);

  const commissionGross = clamp0(split?.commissionGross);
  const passThroughGross = clamp0(split?.passThroughGross);

  // This is the “core” gross excluding extras/manual adjustments
  const coreGross = commissionGross + passThroughGross;

  return {
    _id: row?._id,
    bookingRef: getDisplayBookingRef(row),
    clientFirstNames: getClientFirstNames(row),
    actName: getDisplayActName(row),
    actTscName: getDisplayActTscName(row),
    eventDate: getDisplayEventDate(row),
    baseGross: Number(coreGross || 0),
    depositAmount: Number(deposit || 0),
    eventType: row?.eventType || "",
    venueAddress: getDisplayAddress(row),
    arrivalTime: performance?.arrivalTime || getDisplayArrivalTime(row) || "",
    startTime: performance?.startTime || "",
    finishTime: performance?.finishTime || getDisplayFinishTime(row) || "",
    paLightsFinishTime: performance?.paLightsFinishTime || "",
    paLightsFinishDayOffset:
      Number(performance?.paLightsFinishDayOffset || 0) || 0,
    extras: getExtrasFromRow(row),
    lateStayAppliesTo: "whole_band",
    selectedLateStayMembers: [],
    manualAdjustmentLabel: "",
    manualAdjustmentAmount: "",
    notes: row?.notes || "",
    invoiceCompany,
    vatRate,
    commissionGross,
    passThroughGross,
    coreGross,
  };
};

function BookingUpdateModal({ row, value, onClose, onChange, onSave, saving }) {
  if (!row || !value) return null;

  const extrasTotal = (value.extras || []).reduce((sum, extra) => {
    return sum + Number(extra?.price || 0) * Number(extra?.quantity || 1);
  }, 0);

  const manualAdjustmentAmount = Number(value.manualAdjustmentAmount || 0) || 0;
  const recalculatedGross =
    Number(value.baseGross || 0) + extrasTotal + manualAdjustmentAmount;
  const recalculatedBalance = Math.max(
    0,
    recalculatedGross - Number(value.depositAmount || 0),
  );

  const bandExtraOptions = getBandExtraOptions(row);
  const lineupMemberOptions = getLineupMemberOptions(row);
  const selectedLateStayMembers = Array.isArray(value.selectedLateStayMembers)
    ? value.selectedLateStayMembers
    : [];

  const updateExtra = (id, patch) => {
    onChange({
      ...value,
      extras: (value.extras || []).map((extra) =>
        extra.id === id ? { ...extra, ...patch } : extra,
      ),
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
      category: seed.category || "",
      pricingMode: seed.pricingMode || "flat",
      appliedMinutes: Number(seed.appliedMinutes || 0) || 0,
      billableMemberCount: Number(seed.billableMemberCount || 0) || 0,
      payoutMemberIds: Array.isArray(seed.payoutMemberIds)
        ? seed.payoutMemberIds
        : [],
      payoutMemberNames: Array.isArray(seed.payoutMemberNames)
        ? seed.payoutMemberNames
        : [],
      paLateStay: seed.paLateStay || null,
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

  const upsertNamedExtra = (seed = {}) => {
    const targetKey = String(seed.key || "")
      .trim()
      .toLowerCase();
    const targetName = String(seed.name || "")
      .trim()
      .toLowerCase();

    const existing = (value.extras || []).find((extra) => {
      const extraKey = String(extra?.key || "")
        .trim()
        .toLowerCase();
      const extraName = String(extra?.name || "")
        .trim()
        .toLowerCase();
      return (
        (targetKey && extraKey === targetKey) ||
        (targetName && extraName === targetName)
      );
    });

    if (existing) {
      onChange({
        ...value,
        extras: (value.extras || []).map((extra) =>
          extra.id === existing.id
            ? {
                ...extra,
                ...seed,
                id: existing.id,
              }
            : extra,
        ),
      });
      return;
    }

    addExtra(seed);
  };

  const applyLateStayFee = (minutes) => {
    const lateStayOption = bandExtraOptions.find(
      (option) => option.key === "late_stay_60min_per_band_member",
    );
    if (!lateStayOption) return;

    const mins = Number(minutes || 0) || 0;
    if (mins <= 0) return;

    const netPerBandMember =
      Number(lateStayOption?.meta?.netPerBandMember || 0) || 0;
    const wholeBandCount =
      Number(lateStayOption?.meta?.performerCount || 0) || 0;

    const chosenMembers =
      value.lateStayAppliesTo === "selected_members"
        ? lineupMemberOptions
            .filter((member) => selectedLateStayMembers.includes(member.id))
            .slice(0, 2)
        : [];

    const chosenPersistableIds = chosenMembers
      .map((member) => member.persistableId)
      .filter(Boolean);

    const billableMemberCount =
      value.lateStayAppliesTo === "selected_members"
        ? chosenMembers.length
        : wholeBandCount;

    const gross =
      netPerBandMember > 0 && billableMemberCount > 0
        ? Math.ceil(netPerBandMember * billableMemberCount * (mins / 60) * 1.33)
        : Number(lateStayOption.price || 0) || 0;

    upsertNamedExtra({
      key: "late_stay_60min_per_band_member",
      name: `Late Stay Fee (${mins} mins)`,
      quantity: 1,
      price: gross,
      finishTime: value.paLightsFinishTime || value.finishTime || "",
      arrivalTime: "",
      category: "late_stay",
      pricingMode:
        value.lateStayAppliesTo === "selected_members"
          ? "per_specific_members"
          : "per_band_member",
      appliedMinutes: mins,
      billableMemberCount,
      payoutMemberIds: chosenPersistableIds,
      payoutMemberNames: chosenMembers.map((member) => member.name),
      paLateStay: {
        enabled: true,
        onlySpecificMembers: value.lateStayAppliesTo === "selected_members",
        memberCount: billableMemberCount,
        memberIds: chosenPersistableIds,
        memberNames: chosenMembers.map((member) => member.name),
        additionalMinutesBeyondBand: mins,
        basedOnExtraKey: "late_stay_60min_per_band_member",
      },
    });
  };

  const applyPaLightsUntil1am = () => {
    const nextFinish = "01:00";
    const nextOffset = 1;

    onChange({
      ...value,
      paLightsFinishTime: nextFinish,
      paLightsFinishDayOffset: nextOffset,
    });

    upsertNamedExtra({
      key: "pa_and_lights_hire",
      name: "PA & Lights Hire",
      quantity: 1,
      price: 0,
      finishTime: nextFinish,
      arrivalTime: value.arrivalTime || "",
      category: "pa_hire",
      pricingMode: "flat",
    });

    const bandFinish = value.finishTime || "00:00";
    const [bandHours, bandMins] = String(bandFinish).split(":").map(Number);
    const [paHours, paMins] = nextFinish.split(":").map(Number);

    const bandTotal =
      (Number.isNaN(bandHours) ? 0 : bandHours) * 60 +
      (Number.isNaN(bandMins) ? 0 : bandMins);

    const paTotal =
      (Number.isNaN(paHours) ? 0 : paHours) * 60 +
      (Number.isNaN(paMins) ? 0 : paMins) +
      1440;

    const diff = Math.max(0, paTotal - bandTotal);

    if (diff > 0) {
      applyLateStayFee(diff);
    }
  };

  const selectedInvoiceCompany = String(
    value.invoiceCompany || "TSC",
  ).toUpperCase();
  const vatRateForDisplay = Number(
    value.vatRate ?? INVOICE_COMPANIES[selectedInvoiceCompany]?.vatRate ?? 0,
  );
  const vatDisplay = calcVatFromVatInclusiveGross(
    Number(value.commissionGross || 0),
    vatRateForDisplay,
  ).vat.toFixed(2);


  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Update booking</h2>
            <div className="text-sm text-gray-600 mt-1">
              {value.clientFirstNames || "—"} • {value.bookingRef || "—"} •{" "}
              {value.actTscName || value.actName || "—"}
            </div>
          </div>
          <button className="px-3 py-2 border rounded" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Client</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={value.clientFirstNames || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Booking ref
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={value.bookingRef || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Invoice company
            </label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={value.invoiceCompany || "TSC"}
              onChange={(e) => {
                const invoiceCompany = e.target.value;
                const vatRate = INVOICE_COMPANIES[invoiceCompany]?.vatRate ?? 0;
                onChange({
                  ...value,
                  invoiceCompany,
                  vatRate,
                });
              }}
            >
              <option value="TSC">The Supreme Collective — no VAT</option>
              <option value="BMM">
                Bamboo Music Management — VAT registered
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Arrival</label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.arrivalTime || ""}
              onChange={(e) =>
                onChange({ ...value, arrivalTime: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Band finish
            </label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.finishTime || ""}
              onChange={(e) =>
                onChange({ ...value, finishTime: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              PA/lights finish
            </label>
            <input
              type="time"
              step="300"
              className="border rounded px-3 py-2 w-full"
              value={value.paLightsFinishTime || ""}
              onChange={(e) =>
                onChange({ ...value, paLightsFinishTime: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              PA/lights next day offset
            </label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={value.paLightsFinishDayOffset || 0}
              onChange={(e) =>
                onChange({
                  ...value,
                  paLightsFinishDayOffset: Number(e.target.value || 0),
                })
              }
            >
              <option value={0}>Same day</option>
              <option value={1}>Next day</option>
            </select>
          </div>
        </div>

        <div className="mb-5 border rounded-lg p-4">
          <div className="font-medium mb-3">Accounting split</div>
          <div className="text-xs text-gray-600 mb-3">
            Invoice will be generated as{" "}
            <strong>
              {INVOICE_COMPANIES[selectedInvoiceCompany]?.label ||
                selectedInvoiceCompany}
            </strong>
            {vatRateForDisplay > 0
              ? ` with VAT calculated at ${(vatRateForDisplay * 100).toFixed(0)}% on the commission bucket.`
              : " with no VAT applied."}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Band fee (pass-through) £
              </label>
              <input
                type="number"
                step="0.01"
                className="border rounded px-3 py-2 w-full"
                value={value.passThroughGross ?? 0}
                onChange={(e) => {
                  const passThroughGross = clamp0(e.target.value);
                  const commissionGross = clamp0(value.commissionGross);
                  onChange({
                    ...value,
                    passThroughGross,
                    baseGross: passThroughGross + commissionGross,
                  });
                }}
              />
              <div className="text-[11px] text-gray-500 mt-1">
                Keep this the same if you’re only discounting your commission.
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Commission (gross, VAT-inc) £
              </label>
              <input
                type="number"
                step="0.01"
                className="border rounded px-3 py-2 w-full"
                value={value.commissionGross ?? 0}
                onChange={(e) => {
                  const commissionGross = clamp0(e.target.value);
                  const passThroughGross = clamp0(value.passThroughGross);
                  onChange({
                    ...value,
                    commissionGross,
                    baseGross: passThroughGross + commissionGross,
                  });
                }}
              />
              <div className="text-[11px] text-gray-500 mt-1">
                This is your VAT-able bucket.
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                VAT (from commission)
              </label>
              <input
                className="border rounded px-3 py-2 w-full bg-gray-50"
                readOnly
                value={vatDisplay}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Core gross (commission + band)
              </label>
              <input
                className="border rounded px-3 py-2 w-full bg-gray-50"
                readOnly
                value={Number(
                  (value.passThroughGross || 0) + (value.commissionGross || 0),
                ).toFixed(2)}
              />
            </div>
          </div>
        </div>

        <div className="mb-5 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="font-medium">Extras</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="px-3 py-2 border rounded bg-white"
                onClick={() => addExtra()}
              >
                + Add manual extra
              </button>
              <button
                type="button"
                className="px-3 py-2 border rounded bg-white"
                onClick={() =>
                  upsertNamedExtra({
                    key: "pa_and_lights_hire",
                    name: "PA & Lights Hire",
                    quantity: 1,
                    price: 0,
                    finishTime: value.paLightsFinishTime || "",
                    arrivalTime: value.arrivalTime || "",
                    category: "pa_hire",
                    pricingMode: "flat",
                  })
                }
              >
                + Add PA & lights hire
              </button>
              <button
                type="button"
                className="px-3 py-2 border rounded bg-white"
                onClick={applyPaLightsUntil1am}
              >
                + Add PA hire + late stay until 1am
              </button>
            </div>
          </div>

          {bandExtraOptions.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Band-provided extras
              </div>
              <div className="flex gap-2 flex-wrap">
                {bandExtraOptions.map((extra, idx) => {
                  if (extra.key === "late_stay_60min_per_band_member") {
                    const lateStayChoices = [30, 60, 90, 120, 150, 180];
                    return (
                      <div
                        key={`${extra.key}-${idx}`}
                        className="flex items-center gap-2 border rounded bg-white px-3 py-2"
                      >
                        <span className="text-sm">Late Stay Fee</span>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          defaultValue="60"
                          onChange={(e) =>
                            applyLateStayFee(Number(e.target.value || 0))
                          }
                        >
                          {lateStayChoices.map((mins) => (
                            <option key={mins} value={mins}>
                              {mins} mins
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="px-3 py-1 border rounded text-sm"
                          onClick={() => applyLateStayFee(60)}
                        >
                          Add
                        </button>
                      </div>
                    );
                  }

                  if (extra.key === "pa_and_lights_hire") {
                    return (
                      <div
                        key={`${extra.key}-${idx}`}
                        className="flex items-center gap-2 border rounded bg-white px-3 py-2"
                      >
                        <span className="text-sm">PA & Lights Hire</span>
                        <button
                          type="button"
                          className="px-3 py-1 border rounded text-sm"
                          onClick={() => upsertNamedExtra(extra)}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 border rounded text-sm"
                          onClick={applyPaLightsUntil1am}
                        >
                          Add + late stay to 1am
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={`${extra.key}-${idx}`}
                      type="button"
                      className="px-3 py-2 border rounded bg-white text-sm"
                      onClick={() => upsertNamedExtra(extra)}
                    >
                      Add {extra.name}
                      {typeof extra.price === "number"
                        ? ` (£${extra.price})`
                        : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 border rounded-lg bg-white p-3">
            <div className="text-sm font-medium mb-2">Late stay applies to</div>
            <div className="flex flex-wrap gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lateStayAppliesTo"
                  checked={
                    (value.lateStayAppliesTo || "whole_band") === "whole_band"
                  }
                  onChange={() =>
                    onChange({
                      ...value,
                      lateStayAppliesTo: "whole_band",
                      selectedLateStayMembers: [],
                    })
                  }
                />
                Whole band
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lateStayAppliesTo"
                  checked={value.lateStayAppliesTo === "selected_members"}
                  onChange={() =>
                    onChange({
                      ...value,
                      lateStayAppliesTo: "selected_members",
                      selectedLateStayMembers: Array.isArray(
                        value.selectedLateStayMembers,
                      )
                        ? value.selectedLateStayMembers.slice(0, 2)
                        : [],
                    })
                  }
                />
                Selected members
              </label>
            </div>

            {value.lateStayAppliesTo === "selected_members" && (
              <div>
                <div className="text-xs text-gray-600 mb-2">
                  Choose up to 2 names from the lineup
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lineupMemberOptions.map((member) => {
                    const checked = selectedLateStayMembers.includes(member.id);
                    const disableUnchecked =
                      !checked && selectedLateStayMembers.length >= 2;

                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2 border rounded px-3 py-2 text-sm ${
                          disableUnchecked ? "opacity-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disableUnchecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedLateStayMembers, member.id].slice(
                                  0,
                                  2,
                                )
                              : selectedLateStayMembers.filter(
                                  (id) => id !== member.id,
                                );

                            onChange({
                              ...value,
                              selectedLateStayMembers: next,
                            });
                          }}
                        />
                        <span>{member.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(value.extras || []).length === 0 && (
              <div className="text-sm text-gray-500">No extras added yet.</div>
            )}

            {(value.extras || []).map((extra) => (
              <div
                key={extra.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-lg p-3 bg-white"
              >
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    Extra name
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={extra.name || ""}
                    onChange={(e) =>
                      updateExtra(extra.id, { name: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Key
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={extra.key || ""}
                    onChange={(e) =>
                      updateExtra(extra.id, { key: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.quantity ?? 1}
                    onChange={(e) =>
                      updateExtra(extra.id, {
                        quantity: Number(e.target.value || 1),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.price ?? 0}
                    onChange={(e) =>
                      updateExtra(extra.id, {
                        price: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Arrival
                  </label>
                  <input
                    type="time"
                    step="300"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.arrivalTime || ""}
                    onChange={(e) =>
                      updateExtra(extra.id, { arrivalTime: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Finish
                  </label>
                  <input
                    type="time"
                    step="300"
                    className="border rounded px-3 py-2 w-full"
                    value={extra.finishTime || ""}
                    onChange={(e) =>
                      updateExtra(extra.id, { finishTime: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-12">
                  {Array.isArray(extra.payoutMemberNames) &&
                    extra.payoutMemberNames.length > 0 && (
                      <div className="text-xs text-gray-600 mb-2">
                        Applies to: {extra.payoutMemberNames.join(", ")}
                      </div>
                    )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm underline text-red-600"
                      onClick={() => removeExtra(extra.id)}
                    >
                      Remove
                    </button>
                  </div>
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
                <label className="block text-xs text-gray-600 mb-1">
                  Label
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={value.manualAdjustmentLabel || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      manualAdjustmentLabel: e.target.value,
                    })
                  }
                  placeholder="e.g. goodwill discount or manual hire fee"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-3 py-2 w-full"
                  value={value.manualAdjustmentAmount || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      manualAdjustmentAmount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="font-medium mb-3">Updated totals preview</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Current/base gross</span>
                <strong>
                  £
                  {Number(value.baseGross || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Extras total</span>
                <strong>
                  £
                  {Number(extrasTotal || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Manual adjustment</span>
                <strong>
                  £
                  {Number(manualAdjustmentAmount || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span>New gross total</span>
                <strong>
                  £
                  {Number(recalculatedGross || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Deposit already paid</span>
                <strong>
                  £
                  {Number(value.depositAmount || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated new balance</span>
                <strong>
                  £
                  {Number(recalculatedBalance || 0).toLocaleString("en-GB", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={saving}
            onClick={onSave}
          >
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
  const [mode, setMode] = useState(() =>
    value && !AGENTS.includes(value) ? "Other" : value || "",
  );
  const [text, setText] = useState(() =>
    value && !AGENTS.includes(value) ? value : "",
  );

  useEffect(() => {
    const isOther = value && !AGENTS.includes(value);
    setMode(isOther ? "Other" : value || "");
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
        {AGENTS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
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
 const [sortBy, setSortBy] = useState("eventDateISO");

const [sortDir, setSortDir] = useState("asc");

  // manual add row
  const [newRow, setNewRow] = useState({
    bookerName: "", // NEW
    clientFirstNames: "", // already there
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
    finishTime: "", // already added earlier
    commissionGross: "",
    passThroughGross: "",
    paymentLink: "",
    invoiceUrl: "",
    vatRate: 0, // (since you're not VAT registered yet)
  });
  const [adding, setAdding] = useState(false);
  const [hideInternalTests, setHideInternalTests] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [creatingPayLinkId, setCreatingPayLinkId] = useState(null);
  const [syncingFinanceId, setSyncingFinanceId] = useState(null);
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(100);

  const buildHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

const fetchRows = async () => {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("sortBy", sortBy);
  params.set("sortDir", sortDir);
  params.set("limit", String(limit));
  params.set("page", String(page));

  const url = `${API_BASE}/board/bookings?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: buildHeaders(),
      credentials: "include",
    });

    const raw = await res.text();
    let json = null;

    try {
      json = JSON.parse(raw);
    } catch {}

    if (json?.success) setRows(json.rows || []);
    else setRows([]);
  } catch (e) {
    console.error("Board load failed", e);
    setRows([]);
  }
};

  useEffect(() => {
    fetchRows(); /* eslint-disable-next-line */
  }, []);
useEffect(() => {
  fetchRows();
}, [page, limit, sortBy, sortDir]);

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
      try {
        json = JSON.parse(raw);
      } catch {}
      if (json?.success)
        setRows((prev) => prev.map((r) => (r._id === id ? json.row : r)));
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
        category: extra?.category || "",
        pricingMode: extra?.pricingMode || "flat",
        appliedMinutes: Number(extra?.appliedMinutes || 0) || 0,
        billableMemberCount: Number(extra?.billableMemberCount || 0) || 0,
        payoutMemberIds: Array.isArray(extra?.payoutMemberIds)
          ? extra.payoutMemberIds.filter((id) => isValidObjectIdString(id))
          : [],
        payoutMemberNames: Array.isArray(extra?.payoutMemberNames)
          ? extra.payoutMemberNames
          : [],

        paLateStay: extra?.paLateStay
          ? {
              ...extra.paLateStay,
              memberIds: Array.isArray(extra?.paLateStay?.memberIds)
                ? extra.paLateStay.memberIds.filter((id) =>
                    isValidObjectIdString(id),
                  )
                : [],
              memberNames: Array.isArray(extra?.paLateStay?.memberNames)
                ? extra.paLateStay.memberNames
                : [],
            }
          : null,
      }))
      .filter(
        (extra) =>
          extra.name ||
          extra.key ||
          extra.price ||
          extra.finishTime ||
          extra.arrivalTime,
      );

    const extrasTotal = cleanedExtras.reduce(
      (sum, extra) => sum + extra.price * extra.quantity,
      0,
    );

    const manualAdjustmentAmount =
      Number(editForm.manualAdjustmentAmount || 0) || 0;

    const newGross = Math.max(
      0,
      Number(editForm.baseGross || 0) + extrasTotal + manualAdjustmentAmount,
    );

    const invoiceCompany = String(editForm.invoiceCompany || "TSC").toUpperCase();
    const defaultVatRate = INVOICE_COMPANIES[invoiceCompany]?.vatRate ?? 0;
    const vatRateRaw = Number(editForm.vatRate ?? defaultVatRate);
    const vatRate = Number.isFinite(vatRateRaw) ? vatRateRaw : defaultVatRate;

    const commissionGross = clamp0(editForm.commissionGross);
    const passThroughGross = clamp0(editForm.passThroughGross);
    const { vat: commissionVat, net: commissionNet } =
      calcVatFromVatInclusiveGross(commissionGross, vatRate);

    const depositAmount = Number(editForm.depositAmount || 0) || 0;
    const newBalance = Math.max(0, newGross - depositAmount);

    const currentActsSummary = Array.isArray(editingRow?.actsSummary)
      ? editingRow.actsSummary
      : [];
    const firstAct = currentActsSummary[0] || {};
    const nextPerformance = {
      ...(editingRow?.performanceTimes || {}),
      ...(firstAct?.performance || {}),
      arrivalTime: editForm.arrivalTime || "",
      startTime:
        editForm.startTime ||
        firstAct?.performance?.startTime ||
        editingRow?.performanceTimes?.startTime ||
        "",
      finishTime: editForm.finishTime || "",
      paLightsFinishTime: editForm.paLightsFinishTime || "",
      paLightsFinishDayOffset:
        Number(editForm.paLightsFinishDayOffset || 0) || 0,
    };

    const patch = {
      invoiceCompany,
      totals: {
        ...(editingRow?.totals || {}),
        fullAmount: Number(newGross.toFixed(2)),
        depositAmount: Number(depositAmount.toFixed(2)),
      },
      amount: Number(
        editingRow?.amount || editingRow?.totals?.chargedAmount || 0,
      ),
      fee: Number(newGross.toFixed(2)),
      balanceAmountPence: Math.round(newBalance * 100),
      performanceTimes: nextPerformance,
      bookingDetails: {
        ...(editingRow?.bookingDetails || {}),
        extras: cleanedExtras,
        lateStayAppliesTo: editForm.lateStayAppliesTo || "whole_band",
        selectedLateStayMembers: Array.isArray(editForm.selectedLateStayMembers)
          ? editForm.selectedLateStayMembers
          : [],
      },
      accounting: {
        invoiceCompany,
        paymentStage: String(editingRow?.accounting?.paymentStage || ""),
        vatRate,
        commissionGross: Number(commissionGross.toFixed(2)),
        commissionVat: Number(commissionVat.toFixed(2)),
        commissionNet: Number(commissionNet.toFixed(2)),
        passThroughGross: Number(passThroughGross.toFixed(2)),
        currency: String(
          editingRow?.accounting?.currency ||
            editingRow?.totals?.currency ||
            "GBP",
        ),
      },
      notes: [
        editingRow?.notes || "",
        editForm.manualAdjustmentLabel && manualAdjustmentAmount
          ? `Manual adjustment: ${editForm.manualAdjustmentLabel} (£${manualAdjustmentAmount.toFixed(2)})`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
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
      try {
        json = JSON.parse(raw);
      } catch {}
      if (json?.success && json?.row) {
        setRows((prev) =>
          prev.map((row) => (row._id === json.row._id ? json.row : row)),
        );
        setEditingRow(null);
        setEditForm(null);
      } else {
        console.error("Booking update save response:", json || raw);
        window.alert(json?.message || "Booking update could not be saved.");
      }
    } catch (error) {
      console.error("save booking update failed", error);
      window.alert(error?.message || "Booking update failed.");
    } finally {
      setSavingEdit(false);
    }
  };

  const money = (n) => fmtMoney0(n);

  // --- Helpers for deposit, band size, booking details summary ---
  const calcDeposit = (gross) => {
    if (!gross) return null;
    const n = Math.ceil((Number(gross) - 50) * 0.2) + 50;
    return n > 0 ? n : null;
  };

  const extractBandSize = (row) => {
    if (Number(row?.bandSize)) return Number(row.bandSize);
    if (Number(row?.actsSummary?.[0]?.bandSize))
      return Number(row.actsSummary[0].bandSize);

    const lineupLabel = String(
      row?.lineupSelected ||
        row?.actsSummary?.[0]?.lineupLabel ||
        row?.actsSummary?.[0]?.lineup?.actSize ||
        "",
    );

    const m = lineupLabel.match(/(\d+)\s*[- ]?\s*piece/i);
    return m ? Number(m[1]) : 0;
  };

  const summariseBookingDetails = (bd = {}, row) => {
    const bits = [];

    if (bd?.ceremony?.start || bd?.ceremony?.end) {
      bits.push(
        `Ceremony ${bd.ceremony.start || "?"}–${bd.ceremony.end || "?"}`,
      );
    }

    if (bd?.afternoon?.start || bd?.afternoon?.end) {
      bits.push(
        `Afternoon ${bd.afternoon.start || "?"}–${bd.afternoon.end || "?"}`,
      );
    }

    if (Array.isArray(bd?.evening?.sets) && bd.evening.sets.length) {
      bits.push(
        `Evening ${bd.evening.sets.map((s) => `${s.start || "?"}–${s.end || "?"}`).join(", ")}`,
      );
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

    const perf =
      row?.performanceTimes || row?.actsSummary?.[0]?.performance || {};
    if (perf?.startTime || perf?.finishTime) {
      bits.push(
        `Performance ${perf.startTime || "?"}–${perf.finishTime || "?"}`,
      );
    }

    const venueName = row?.eventSheet?.answers?.venue_name || row?.venue || "";
    if (venueName) bits.push(venueName);

    const firstSec = summariseEventSheetFirstSection(row);
    if (firstSec) bits.unshift(firstSec);

    return bits.join(" • ");
  };

  const syncBookingToFinance = async (row) => {
    const busyKey = String(row?._id || "");

    try {
      setSyncingFinanceId(busyKey);

      const url = `${API_BASE}/finance/forecast/bookings/sync-from-board/${row._id}`;
      console.log("Sync finance URL:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
      });

      const raw = await res.text();
      let json = null;

      try {
        json = JSON.parse(raw);
      } catch {
        console.error("Non-JSON sync response:", raw);
        window.alert(
          `Sync failed: backend returned non-JSON. Check route/API_BASE.`,
        );
        return;
      }

      if (!res.ok || !json?.success) {
        window.alert(json?.message || "Could not sync booking to finance.");
        return;
      }

      window.alert("Booking synced to finance forecast.");
      await fetchRows();
    } catch (error) {
      console.error("sync finance failed", error);
      window.alert(error.message || "Sync failed.");
    } finally {
      setSyncingFinanceId(null);
    }
  };

  const createPayLinkForRow = async (row) => {
    const bookingRef = getDisplayBookingRef(row);

    // Total booking value (major units)
    const grossMajor = Number(getDisplayGross(row) || 0) || 0;

    // What they've already paid (major units).
    // Prefer explicit chargedAmount if present, otherwise fall back to deposit amount.
    const chargedMajor =
      Number(
        row?.totals?.chargedAmount ??
          row?.payments?.depositChargedAmount ??
          row?.payments?.depositAmount ??
          row?.amount ??
          0,
      ) || 0;

    // Remaining (major)
    const remainingMajor = Math.max(0, +(grossMajor - chargedMajor).toFixed(2));

    // Decide invoice stage:
    // - remaining > 0 AND they've already paid something -> BALANCE (invoice remaining)
    // - remaining > 0 AND they've paid nothing -> FULL (invoice gross)
    // - remaining == 0 -> nothing to invoice
    let stage = "";
    let invoiceMajor = 0;

    if (remainingMajor > 0 && chargedMajor > 0) {
      stage = "balance";
      invoiceMajor = remainingMajor;
    } else if (remainingMajor > 0) {
      stage = "full";
      invoiceMajor = grossMajor;
    } else {
      window.alert("No outstanding amount to invoice.");
      return;
    }

    // Pence
    const amountPence = Math.round(invoiceMajor * 100);
    const customerEmail = getPrimaryEmail(row);
    const customerName = getClientFirstNames(row);

    if (!bookingRef || !customerEmail || amountPence <= 0) {
      window.alert(
        "Missing booking ref, client email, or amount for invoice creation.",
      );
      return;
    }

    const busyKey = String(row?._id || bookingRef);

    try {
      setCreatingPayLinkId(busyKey);

      const res = await fetch(`${API_BASE}/invoices/create`, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify({
          bookingIdOrRef: bookingRef,
          stage,
          amountPence,
          currency: String(
            row?.totals?.currency || row?.payments?.currency || "GBP",
          ),
          customerEmail,
          customerName,
          metadata: {
            source: "admin_booking_board",
            rowId: String(row?._id || ""),
          },
        }),
      });

      const raw = await res.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {}

      if (!json?.success) {
        console.error("create pay link failed", json || raw);
        window.alert(json?.message || "Failed to create pay link.");
        return;
      }

      // Refresh so payment/invoice links show
      await fetchRows();
    } catch (e) {
      console.error("createPayLinkForRow failed", e);
      window.alert(e?.message || "Failed to create pay link.");
    } finally {
      setCreatingPayLinkId(null);
    }
  };

  const getFirstValidEmail = (row) => {
  const raw =
    row?.clientEmails?.[0]?.email ||
    row?.clientEmail ||
    row?.userEmail ||
    "";

  return String(raw)
    .split(",")
    .map((e) => e.trim())
    .find((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) || "";
};

const createInvoiceForRow = async (row) => {
  const bookingRef = getDisplayBookingRef(row);

  try {
    const res = await fetch(`${API_BASE}/invoices/create-board-invoice`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify({
        bookingId: row._id,
        includePaymentLink: false,
      }),
    });

    const raw = await res.text();
    let json = null;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error("Non-JSON invoice response:", raw);
      window.alert("Invoice failed: backend returned non-JSON.");
      return;
    }

    if (!json?.success) {
      window.alert(json?.message || "Could not create invoice.");
      return;
    }

    window.alert("Invoice generated.");
    await fetchRows();
  } catch (error) {
    console.error("create invoice failed", error);
    window.alert(error.message || "Invoice failed.");
  }
};

const createCardPaymentInvoiceForRow = async (row) => {
  const confirmed = window.confirm(
    "Create a CARD PAYMENT invoice?\n\nMake sure you have updated the commission to include the card processing fee first.",
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/invoices/create-board-invoice`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify({
        bookingId: row._id,
        includePaymentLink: true,
      }),
    });

    const json = await res.json();

    if (!json?.success) {
      window.alert(json?.message || "Could not create card payment invoice.");
      return;
    }

    window.alert("Card payment invoice generated.");
    await fetchRows();
  } catch (error) {
    console.error("create card payment invoice failed", error);
    window.alert(error.message || "Card payment invoice failed.");
  }
};

  const postManualRow = async () => {
    try {
      // --- accounting split for manual rows ---
      const grossValue = Number(newRow.grossValue || 0) || 0;
      const vatRateRaw = Number(newRow.vatRate);
      const vatRate = Number.isFinite(vatRateRaw) ? vatRateRaw : 0;
      let commissionGross = clamp0(newRow.commissionGross);
      let passThroughGross = clamp0(newRow.passThroughGross);

      // If user only entered one side, infer the other from gross.
      if (grossValue > 0) {
        if (commissionGross > 0 && passThroughGross <= 0) {
          passThroughGross = clamp0(grossValue - commissionGross);
        } else if (passThroughGross > 0 && commissionGross <= 0) {
          commissionGross = clamp0(grossValue - passThroughGross);
        }
      }

      const hasSplit = commissionGross > 0 || passThroughGross > 0;

      const { vat: commissionVat, net: commissionNet } =
        calcVatFromVatInclusiveGross(commissionGross, vatRate);

      const payload = {
        ...newRow,
        clientEmails: newRow.clientEmail ? [{ email: newRow.clientEmail }] : [],
        grossValue,

        // ✅ this is the important bit for your table + modal
        accounting: hasSplit
          ? {
              paymentStage: "",
              vatRate,
              commissionGross: Number(commissionGross.toFixed(2)),
              commissionVat: Number(commissionVat.toFixed(2)),
              commissionNet: Number(commissionNet.toFixed(2)),
              passThroughGross: Number(passThroughGross.toFixed(2)),
              currency: "GBP",
            }
          : undefined,

        bookingDetails: {},
        allocation: { status: "in_progress" },
        review: { requestedCount: 0, received: false },
        source: "manual",
        enquiryDateISO: newRow.enquiryDateISO || "", // optional
        bookingDateISO: newRow.bookingDateISO || "", // optional
        arrivalTime: newRow.arrivalTime || "",
        finishTime: newRow.finishTime || "",
        paymentLink: String(newRow.paymentLink || "").trim(),
        invoiceUrl: String(newRow.invoiceUrl || "").trim(),
      };

      const res = await fetch(`${API_BASE}/board/bookings`, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {}

      if (json?.success) {
        setRows((r) => [...r, json.row]);
        setAdding(false);
        setNewRow({
          bookerName: "",
          clientFirstNames: "",
          bookingRef: "",
          eventDateISO: "",
          agent: "Direct",
          clientEmail: "",
          clientAddress: "",
          actName: "",
          actTscName: "",
          address: "",
          county: "",
          grossValue: "",
          // 👇 reset the split fields too
          commissionGross: "",
          passThroughGross: "",
          vatRate: 0.2,
          lineupSelected: "",
          arrivalTime: "",
          finishTime: "",
          enquiryDateISO: "",
          bookingDateISO: "",
          paymentLink: "",
          invoiceUrl: "",
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
        <button
  className="px-4 py-2 rounded bg-black text-white"
  onClick={() => {
    setPage(1);
    fetchRows();
  }}
>
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

      <select
  className="border rounded px-2 py-1"
  value={limit}
  onChange={(e) => {
    setPage(1);
    setLimit(Number(e.target.value));
  }}
>
  <option value={50}>50 rows</option>
  <option value={100}>100 rows</option>
  <option value={250}>250 rows</option>
</select>

<button
  className="px-3 py-2 border rounded"
  disabled={page <= 1}
  onClick={() => setPage((p) => Math.max(1, p - 1))}
>
  Prev
</button>

<span className="text-sm text-gray-600">Page {page}</span>

<button
  className="px-3 py-2 border rounded"
  onClick={() => setPage((p) => p + 1)}
>
  Next
</button>

      <div className="overflow-auto border rounded max-h-[calc(100vh-170px)]">
        <table className="min-w-[4200px] table-fixed text-xs">
          <colgroup>
            <col style={{ width: 140 }} /> {/* First names */}
            <col style={{ width: 160 }} /> {/* Ref */}
            <col style={{ width: 110 }} /> {/* Event Sheet */}
            <col style={{ width: 110 }} /> {/* Contract */}
            <col style={{ width: 150 }} /> {/* Enquiry Date */}
            <col style={{ width: 150 }} /> {/* Booking Date */}
            <col style={{ width: 150 }} /> {/* Event Date */}
            <col style={{ width: 110 }} /> {/* Gross */}
            <col style={{ width: 110 }} /> {/* Deposit */}
            <col style={{ width: 110 }} /> {/* Balance */}
            <col style={{ width: 130 }} /> {/* Commission */}
            <col style={{ width: 110 }} /> {/* VAT */}
            <col style={{ width: 150 }} /> {/* Pass-through */}
            <col style={{ width: 230 }} /> {/* Agent */}
            <col style={{ width: 260 }} /> {/* Client Emails */}
            <col style={{ width: 320 }} /> {/* Client Address */}
            <col style={{ width: 120 }} /> {/* Event Type */}
            <col style={{ width: 150 }} /> {/* Act */}
            <col style={{ width: 150 }} /> {/* Act tscName */}
            <col style={{ width: 320 }} /> {/* Address */}
            <col style={{ width: 110 }} /> {/* County */}
            <col style={{ width: 110 }} /> {/* Band Size */}
            <col style={{ width: 200 }} /> {/* Lineup */}
            <col style={{ width: 120 }} /> {/* Arrival */}
            <col style={{ width: 260 }} /> {/* Booking details */}
            <col style={{ width: 80 }} /> {/* DJ */}
            <col style={{ width: 140 }} /> {/* Allocated */}
            <col style={{ width: 140 }} /> {/* Review */}
            <col style={{ width: 120 }} /> {/* Balance Paid */}
            <col style={{ width: 120 }} /> {/* Band Paid */}
            <col style={{ width: 120 }} /> {/* Payment */}
            <col style={{ width: 120 }} /> {/* Invoice */}
            <col style={{ width: 130 }} /> {/* Actions */}
          </colgroup>

          <thead className="bg-gray-50 text-left sticky top-0 z-10">
          <tr>
  <th className={`px-3 py-2 border-b ${stickyHead1}`}>First names</th>
  <th className={`px-3 py-2 border-b ${stickyHead2}`}>Ref</th>

  {[
    "Event Sheet",
    "Contract",
    "Enquiry Date",
    "Booking Date",
    "Event Date",
    "Gross",
    "Deposit",
    "Balance",
    "Commission",
    "VAT",
    "Hold (pass-through)",
    "Agent",
    "Client Emails",
    "Client Address",
    "Event Type",
    "Act",
    "Act tscName",
    "Address",
    "County",
    "Band Size",
    "Lineup",
    "Booking times",
    "Booking details",
    "DJ",
    "Allocated",
    "Review",
    "Balance Paid",
    "Band Paid",
    "Payment",
    "Invoice",
    "Actions",
  ].map((h) => (
    <th key={h} className="px-3 py-2 border-b whitespace-nowrap">
      {h}
    </th>
  ))}
</tr>
          </thead>

          <tbody>
            {mergedRows
              .filter((r) =>
                hideInternalTests ? !isInternalTestBooking(r) : true,
              )
              .map((r) => {
                const clientFirstNames = getClientFirstNames(r);
                const bookingRef = getDisplayBookingRef(r);
                const eventDate = getDisplayEventDate(r);
                const gross = getDisplayGross(r);
                const depositFromBackend = getDisplayDeposit(r);
                const deposit =
  depositFromBackend != null
    ? depositFromBackend
    : agentTakesDeposit(r)
      ? calcDeposit(gross)
      : 0;
                const balance = gross
                  ? Math.max(0, Math.round(gross - (deposit || 0)))
                  : null;
                const split = getAccountingSplit(r, gross, deposit);

                const commission = split?.commissionGross || 0;
                const vat = split?.commissionVat || 0;
                const hold = split?.passThroughGross || 0;
                const fallbackEventSheetUrl = `${PUBLIC_SITE_BASE}/event-sheet/${encodeURIComponent(bookingRef || "")}`;
                const contractUrl =
                  r?.contractUrl ||
                  r?.pdfUrl ||
                  (r?.contract && (r.contract.url || r.contract.href)) ||
                  "";
                const normalizedContractUrl = normalizeUrl(contractUrl);
                const paymentUrl = getPaymentUrl(r);
                const invoiceUrl = getInvoiceUrl(r);
                const actName = getDisplayActName(r);
                const actTsc = getDisplayActTscName(r);
                const address = getDisplayAddress(r);
                const county = getDisplayCounty(r);
                const arrivalTime = getDisplayArrivalTime(r);
                const finishTime = getDisplayFinishTime(r);
                const clientEmails = getDisplayClientEmails(r);
                const performanceTimes =
                  r?.performanceTimes || r?.actsSummary?.[0]?.performance || {};
                const balancePaid = Boolean(
                  r?.payments?.balancePaymentReceived ?? r?.balancePaid,
                );
                const bandPaid = Boolean(
                  r?.payments?.bandPaymentsSent ?? r?.bandPaymentsSent,
                );

                return (
                  <tr
                    key={r._id}
                    className="odd:bg-white even:bg-gray-50 align-top"
                  >
                   <td className={`px-3 py-2 ${stickyCol1}`}>
  <InlineInput
    value={clientFirstNames}
    placeholder="Client name"
    onCommit={(val) =>
      onInlineEdit(r._id, {
        clientFirstNames: val,
        clientName: val,
        bookerName: val,
      })
    }
  />
</td>

<td className={`px-3 py-2 ${stickyCol2}`}>
  <ReadOnlyInput value={bookingRef} />
</td>
                    {/* Event Sheet */}
                    <td className={cellClass}>
                      {r.eventSheetLink ? (
                        <a
                          className="text-blue-600 underline"
                          href={r.eventSheetLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        <button
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                          onClick={() => {
                            if (
                              !PUBLIC_SITE_BASE ||
                              PUBLIC_SITE_BASE.includes("localhost:5174")
                            ) {
                              window.alert(
                                "Event sheet fallback URL is not configured yet. Please set VITE_PUBLIC_SITE_URL to the live public site URL.",
                              );
                              return;
                            }
                            window.open(
                              fallbackEventSheetUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                        >
                          Open
                        </button>
                      )}
                    </td>
                    {/* Contract */}
                    <td className={cellClass}>
                      {normalizedContractUrl ? (
                        <a
                          className="text-blue-600 underline"
                          href={normalizedContractUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cellClass}>
                      <InlineInput
                        value={fmtShort(r.enquiryDateISO || r.createdAt)}
                      />
                    </td>
                    <td className={cellClass}>
                      {fmtShort(r.bookingDateISO || r.createdAt)}
                    </td>
                    <td className={cellClass}>{fmtOrdinal(eventDate)}</td>
                    <td className={cellClass}>
                      {gross ? (
                        <div>
                          <div>
                            {" "}
                            <InlineInput value={gross ? money(gross) : ""} />
                          </div>

                          {(split?.commissionGross > 0 ||
                            split?.passThroughGross > 0) && (
                            <div className="text-[11px] text-gray-600 leading-4 mt-1">
                              <span title={`Source: ${split.source}`}>
                                Comm
                              </span>
                              : £
                              {Number(
                                split.commissionGross || 0,
                              ).toLocaleString("en-GB", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              {split?.commissionVat ? (
                                <>
                                  {" "}
                                  (VAT £
                                  {Number(
                                    split.commissionVat || 0,
                                  ).toLocaleString("en-GB", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  )
                                </>
                              ) : null}
                              {split?.passThroughGross ? (
                                <>
                                  {" "}
                                  • Held: £
                                  {Number(
                                    split.passThroughGross || 0,
                                  ).toLocaleString("en-GB", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cellClass}>
                      {deposit != null ? (
                        <div>
                          <div>
                            {" "}
                            <InlineInput
                              value={deposit ? money(deposit) : ""}
                            />
                          </div>

                          {!split?.hasAccounting && (
                            <div className="text-[11px] text-gray-500 leading-4 mt-1">
                              {r?.source === "manual"
                                ? "Manual split"
                                : "Awaiting webhook split"}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>{" "}
                    <td className={cellClass}>
                      <InlineInput
                        value={balance != null ? money(balance) : ""}
                      />
                    </td>
                    <td className={cellClass}>
                      {commission ? (
                        <div className="leading-tight">
                          <div>
                            {" "}
                            <InlineInput
                              value={commission ? fmtMoney0(commission) : ""}
                            />
                          </div>
                          {split?.hasAccounting ? (
                            <div className="text-[11px] text-gray-500">
                              from accounting
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-500">
                              estimated
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cellClass}>{vat ? fmtMoney0(vat) : "—"}</td>
                    <td className={cellClass}>
                      <InlineInput value={hold ? money(hold) : ""} />
                    </td>
                    <td className={cellClass}>
                      <AgentCell
                        value={r.agent || "Direct"}
                        onSave={(val) => onInlineEdit(r._id, { agent: val })}
                      />
                    </td>
                    <td className={cellClass}>
                      <InlineInput
                        value={clientEmails[0]?.email || ""}
                        placeholder="Client email"
                        onCommit={(val) =>
                          onInlineEdit(r._id, {
                            clientEmail: val,
                            userEmail: val,
                            clientEmails: val ? [{ email: val }] : [],
                          })
                        }
                      />
                    </td>
                    <td className={cellClass}>
  <InlineInput
    value={r.clientAddress || ""}
    placeholder="Client address"
    onCommit={(val) =>
      onInlineEdit(r._id, { clientAddress: val })
    }
  />
</td>
                    <td className={cellClass}>{r.eventType || "—"}</td>
                    <td className={cellClass}>
                      <InlineInput
                        value={actName || ""}
                        placeholder="Act"
                        onCommit={(val) =>
                          onInlineEdit(r._id, { actName: val })
                        }
                      />
                    </td>
                    <td className={cellClass}>
                      <InlineInput
                        value={actTsc || ""}
                        placeholder="Act tscName"
                        onCommit={(val) =>
                          onInlineEdit(r._id, { actTscName: val })
                        }
                      />
                    </td>
                    <td className={cellClass}>
                      <InlineInput
                        value={address || ""}
                        placeholder="Address"
                        onCommit={(val) =>
                          onInlineEdit(r._id, { address: val })
                        }
                      />
                    </td>
                    <td className={cellClass}>
                      <InlineInput
                        value={county || ""}
                        placeholder="County"
                        onCommit={(val) => onInlineEdit(r._id, { county: val })}
                      />
                    </td>
                    <td className={cellClass}>{extractBandSize(r)}</td>
                    <td className={cellClass}>
                      <InlineInput
                        value={r.lineupSelected || ""}
                        placeholder="Lineup"
                        onCommit={(val) =>
                          onInlineEdit(r._id, { lineupSelected: val })
                        }
                      />
                    </td>
                    <td className={cellClass}>
                      <div className="flex flex-col gap-2 min-w-[150px]">
                        <InlineInput
                          type="time"
                          value={arrivalTime || ""}
                          placeholder="Arrival"
                          onCommit={(val) =>
                            onInlineEdit(r._id, { arrivalTime: val })
                          }
                        />
                        <InlineInput
                          type="time"
                          value={finishTime || ""}
                          placeholder="Finish"
                          onCommit={(val) =>
                            onInlineEdit(r._id, { finishTime: val })
                          }
                        />
                      </div>
                    </td>
                    <td className={cellClass}>
                      <div className="text-xs leading-5">
                        <input
                          readOnly
                          value={summariseBookingDetails(r.bookingDetails, r)}
                          className={`${inputClass} min-w-[420px] bg-gray-50 text-gray-600`}
                        />
                      </div>
                    </td>
                    <td className={cellClass}>
                      {r.bookingDetails?.djServicesBooked ? "Yes" : "No"}
                    </td>
                    <td className={cellClass}>
                      {r.allocation?.status === "fully_allocated" ? (
                        <Tag>✅ Allocated</Tag>
                      ) : r.allocation?.status === "gap" ? (
                        <Tag>⚠️ Gap</Tag>
                      ) : r.allocation?.status === "in_progress" ? (
                        <Tag>⏳ In progress</Tag>
                      ) : (
                        <Tag>—</Tag>
                      )}
                    </td>
                    <td className={cellClass}>
                      {r.review?.received ? (
                        <Tag>⭐ Received</Tag>
                      ) : (
                        <button
                          className="text-xs underline"
                          onClick={() =>
                            onInlineEdit(r._id, {
                              review: {
                                ...(r.review || {}),
                                requestedCount:
                                  (r.review?.requestedCount || 0) + 1,
                                lastRequestedAt: new Date().toISOString(),
                              },
                            })
                          }
                        >
                          Send request
                        </button>
                      )}
                    </td>
                    <td className={cellClass}>
                      {balancePaid ? (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          —
                        </span>
                      )}
                    </td>
                    <td className={cellClass}>
                      {bandPaid ? (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          —
                        </span>
                      )}
                    </td>
                    <td className={cellClass}>
                      {paymentUrl ? (
                        <a
                          className="text-blue-600 underline"
                          href={paymentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Pay
                        </a>
                      ) : (
                        <button
                          className="px-2 py-1 border rounded hover:bg-gray-100 text-xs"
                          disabled={
                            creatingPayLinkId === String(r?._id || bookingRef)
                          }
                          onClick={() => createPayLinkForRow(r)}
                          title="Create a Stripe hosted invoice link"
                        >
                          {creatingPayLinkId === String(r?._id || bookingRef)
                            ? "Creating…"
                            : "Create pay link"}
                        </button>
                      )}
                    </td>
                  <td className={cellClass}>
  <div className="flex flex-col gap-1">
    {invoiceUrl ? (
      <a
        className="text-blue-600 underline"
        href={invoiceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Invoice
      </a>
    ) : (
      <span className="text-gray-400">—</span>
    )}

    <button
      className="px-2 py-1 border rounded hover:bg-gray-100 text-xs"
      onClick={() => createInvoiceForRow(r)}
    >
      {invoiceUrl ? "Regenerate invoice" : "Create invoice"}
    </button>

    <button
      type="button"
      className="px-2 py-1 rounded border text-xs bg-white hover:bg-gray-50"
      onClick={() => createCardPaymentInvoiceForRow(r)}
    >
      Create card payment invoice
    </button>
  </div>
</td>
                    <td className={cellClass}>
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-3 py-1.5 border rounded hover:bg-gray-100"
                          onClick={() => openEditModal(r)}
                        >
                          Update
                        </button>

                        <button
                          className="px-3 py-1.5 border rounded hover:bg-gray-100 disabled:opacity-50"
                          disabled={syncingFinanceId === String(r?._id || "")}
                          onClick={() => syncBookingToFinance(r)}
                        >
                          {syncingFinanceId === String(r?._id || "")
                            ? "Syncing..."
                            : "Sync finance"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {adding && (
              <tr className="bg-yellow-50 sticky top-[49px] z-[5]">
                <td
                  colSpan={999}
                  className="px-3 py-3 border-b border-yellow-200"
                >
                  <div className="flex flex-col gap-3">
                    {/* Row 1: core id + dates */}
                    <div className="flex flex-wrap gap-2 items-end">
                      <input
                        className="border rounded px-2 py-1 w-56"
                        placeholder="Booker full name"
                        value={newRow.bookerName}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            bookerName: e.target.value,
                          }))
                        }
                      />

                      <input
                        className="border rounded px-2 py-1 w-56"
                        placeholder="Client first names"
                        value={newRow.clientFirstNames}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            clientFirstNames: e.target.value,
                          }))
                        }
                      />
                      <InlineInput
                        className="border rounded px-2 py-1 w-40"
                        placeholder="Ref"
                        value={newRow.bookingRef}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            bookingRef: e.target.value,
                          }))
                        }
                      />
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Event date
                        </label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={newRow.eventDateISO}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              eventDateISO: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Enquiry date
                        </label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={newRow.enquiryDateISO}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              enquiryDateISO: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Booking date
                        </label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={newRow.bookingDateISO}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              bookingDateISO: e.target.value,
                            }))
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
                          setNewRow((v) => ({
                            ...v,
                            clientEmail: e.target.value,
                          }))
                        }
                      />

                      <input
  className="border rounded px-2 py-1 w-[360px]"
  placeholder="Client address"
  value={newRow.clientAddress}
  onChange={(e) =>
    setNewRow((v) => ({ ...v, clientAddress: e.target.value }))
  }
/>

                      <input
                        className="border rounded px-2 py-1 w-28"
                        placeholder="Gross"
                        value={newRow.grossValue}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            grossValue: e.target.value,
                          }))
                        }
                      />

                      {/* NEW: Commission (VAT-inc) */}
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded px-2 py-1 w-36"
                        placeholder="Commission"
                        value={newRow.commissionGross ?? ""}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            commissionGross: e.target.value,
                          }))
                        }
                      />

                      {/* NEW: Pass-through (band fee / held) */}
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded px-2 py-1 w-36"
                        placeholder="Pass-through"
                        value={newRow.passThroughGross ?? ""}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            passThroughGross: e.target.value,
                          }))
                        }
                      />

                      {/* NEW: VAT rate */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          VAT rate
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="border rounded px-2 py-1 w-24"
                          value={newRow.vatRate ?? 0.2}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              vatRate:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Row 2b: payment + invoice links */}
                    <div className="flex flex-wrap gap-2 items-end">
                      <input
                        className="border rounded px-2 py-1 w-[360px]"
                        placeholder="Payment link / checkout URL (optional)"
                        value={newRow.paymentLink}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            paymentLink: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="border rounded px-2 py-1 w-[360px]"
                        placeholder="Invoice PDF URL (optional)"
                        value={newRow.invoiceUrl}
                        onChange={(e) =>
                          setNewRow((v) => ({
                            ...v,
                            invoiceUrl: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Row 3: lineup + times */}
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Lineup label
                        </label>
                        <input
                          className="border rounded px-2 py-1 w-56"
                          placeholder="e.g., 4-Piece"
                          value={newRow.lineupSelected}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              lineupSelected: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Arrival time
                        </label>
                        <input
                          type="time"
                          className="border rounded px-2 py-1 w-36"
                          step="300"
                          value={newRow.arrivalTime}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              arrivalTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">
                          Finish time
                        </label>
                        <input
                          type="time"
                          className="border rounded px-2 py-1 w-36"
                          step="300"
                          value={newRow.finishTime}
                          onChange={(e) =>
                            setNewRow((v) => ({
                              ...v,
                              finishTime: e.target.value,
                            }))
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
                          setNewRow((v) => ({
                            ...v,
                            actTscName: e.target.value,
                          }))
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
                      <button
                        className="px-3 py-2 bg-black text-white rounded"
                        onClick={postManualRow}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-2 border rounded"
                        onClick={() => setAdding(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {mergedRows.filter((r) =>
              hideInternalTests ? !isInternalTestBooking(r) : true,
            ).length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-gray-500"
                  colSpan={32}
                >
                  No rows yet.
                  <div className="text-xs mt-2">
                    API: {API_BASE}/board/bookings • token:{" "}
                    {getAuthToken() ? "found" : "missing"}
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
