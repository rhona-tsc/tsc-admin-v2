const calculateActPricing = async (
  act,
  selectedCounty,
  selectedAddress,
  selectedDate,
  selectedLineup
) => {
  console.log(
    `🧪 act.costPerMile: ${act.costPerMile}, useCountyTravelFee: ${act.useCountyTravelFee}`
  );
  console.log(`🗺️ act.countyFees:`, act.countyFees);

  // Backend base URL (Render). Fallback keeps things working if env var is missing.
  const BASE = (import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com")
    .replace(/\/+$/, "");

  // Tiny helper: fetch travel JSON safely (new v2 endpoint) and support both shapes
  const fetchTravel = async (origin, destination, dateISO) => {
    const url = `${BASE}/api/v2/travel?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
      destination
    )}&date=${encodeURIComponent(dateISO)}`;

    const res = await fetch(url, { headers: { accept: "application/json" } });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) throw new Error(`travel http ${res.status}`);

    // Normalizers (prefer new shape; fall back to legacy rows/elements)
    const firstEl = data?.rows?.[0]?.elements?.[0];
    const outbound =
      data?.outbound ||
      (firstEl?.distance && firstEl?.duration
        ? { distance: firstEl.distance, duration: firstEl.duration, fare: firstEl.fare }
        : undefined);
    const returnTrip = data?.returnTrip;

    return { outbound, returnTrip, raw: data };
  };

  let travelFee = 0;

  // ---- choose lineup (smallest or provided) ----
  let smallestLineup = null;
  if (selectedLineup && Array.isArray(selectedLineup.bandMembers)) {
    smallestLineup = selectedLineup;
  } else {
    smallestLineup = act.lineups?.reduce((min, lineup) => {
      if (!Array.isArray(lineup.bandMembers)) return min;
      if (!min || lineup.bandMembers.length < min.bandMembers.length) return lineup;
      return min;
    }, null);
  }

  if (!smallestLineup) {
    console.warn(`⚠️ No valid lineup found for ${act.name}`);
    return null;
  }
  if (!Array.isArray(smallestLineup.bandMembers)) {
    console.warn(`⚠️ Lineup found but bandMembers is not an array:`, smallestLineup);
    return null;
  }

  // ---- northern logic (for team swap) ----
  const northernCounties = new Set([
    "ceredigion","cheshire","cleveland","conway","cumbria","denbighshire","derbyshire","durham",
    "flintshire","greater manchester","gwynedd","herefordshire","lancashire","leicestershire",
    "lincolnshire","merseyside","north humberside","north yorkshire","northumberland",
    "nottinghamshire","rutland","shropshire","south humberside","south yorkshire",
    "staffordshire","tyne and wear","warwickshire","west midlands","west yorkshire",
    "worcestershire","wrexham","rhondda cynon taf","torfaen","neath port talbot","bridgend",
    "blaenau gwent","caerphilly","cardiff","merthyr tydfil","newport","aberdeen city",
    "aberdeenshire","angus","argyll and bute","clackmannanshire","dumfries and galloway",
    "dundee city","east ayrshire","east dunbartonshire","east lothian","east renfrewshire",
    "edinburgh","falkirk","fife","glasgow","highland","inverclyde","midlothian","moray",
    "na h eileanan siar","north ayrshire","north lanarkshire","orkney islands","perth and kinross",
    "renfrewshire","scottish borders","shetland islands","south ayrshire","south lanarkshire",
    "stirling","west dunbartonshire","west lothian"
  ]);
  const isNorthernGig = northernCounties.has(String(selectedCounty || "").toLowerCase().trim());

  const bandMembers =
    act.useDifferentTeamForNorthernGigs && isNorthernGig
      ? act.northernTeam || []
      : smallestLineup.bandMembers || [];

  console.log(`🎵 Calculating for ${act.name}`);

  // ---- essential fees (net) ----
  const essentialFees = smallestLineup.bandMembers.flatMap((member) => {
    const baseFee = member.isEssential ? Number(member.fee) || 0 : 0;
    const additionalEssentialFees = (member.additionalRoles || [])
      .filter((role) => role.isEssential)
      .map((role) => Number(role.additionalFee) || 0);
    return [baseFee, ...additionalEssentialFees];
  });
  const fee = essentialFees.reduce((sum, n) => sum + n, 0);

  // ---- travel fee paths ----
  const memberPostcodes = (bandMembers || []).map((m) => m?.postCode).filter(Boolean);
  console.log("📍 Member Postcodes:", memberPostcodes);
  console.log(`🧱 All lineups for ${act.name}:`, act.lineups);

  // 1) County table
  if (act.useCountyTravelFee && act.countyFees) {
    const countyKey = String(selectedCounty || "").toLowerCase();
    const feePerMember = act.countyFees[countyKey] || 0;
    travelFee = (Number(feePerMember) || 0) * memberPostcodes.length;
  }
  // 2) Per-mile
  else if (Number(act.costPerMile) > 0) {
    for (const postCode of memberPostcodes) {
      const destination =
        typeof selectedAddress === "string"
          ? selectedAddress
          : selectedAddress?.postcode || selectedAddress?.address || "";
      if (!destination) {
        console.warn(`⚠️ No destination address; skipping ${postCode}`);
        continue;
      }
      try {
        console.log("🚚 Fetching travel data (per-mile):", { origin: postCode, destination, date: selectedDate });
        const { outbound, raw } = await fetchTravel(postCode, destination, selectedDate);
        const meters =
          outbound?.distance?.value ??
          raw?.rows?.[0]?.elements?.[0]?.distance?.value ??
          0;
        const miles = meters / 1609.34;
        travelFee += miles * Number(act.costPerMile) * 25; // keep your business multiplier
      } catch (e) {
        console.warn("⚠️ travel fetch failed (per-mile):", e?.message || e);
      }
    }
  }
  // 3) MU-style (fuel/time/late/tolls) using outbound+returnTrip
  else {
    for (const member of smallestLineup.bandMembers) {
      const postCode = member?.postCode;
      const destination =
        typeof selectedAddress === "string"
          ? selectedAddress
          : selectedAddress?.postcode || selectedAddress?.address || "";
      if (!postCode || !destination) continue;

      try {
        console.log("🚚 Fetching travel data (MU):", { origin: postCode, destination, date: selectedDate });
        const { outbound, returnTrip } = await fetchTravel(postCode, destination, selectedDate);
        if (!outbound || !returnTrip) {
          console.warn(`⚠️ Missing legs for ${member?.firstName || "member"}`);
          continue;
        }

        const outboundDistance = outbound?.distance?.value;
        const returnDistance = returnTrip?.distance?.value;
        const outboundDuration = outbound?.duration?.value;
        const returnDuration = returnTrip?.duration?.value;

        if (
          typeof outboundDistance !== "number" ||
          typeof returnDistance !== "number" ||
          typeof outboundDuration !== "number" ||
          typeof returnDuration !== "number"
        ) {
          console.warn(`⚠️ Missing numeric values for ${member?.firstName || "member"}`);
          continue;
        }

        const totalDistanceMiles = (outboundDistance + returnDistance) / 1609.34;
        const totalDurationHours = (outboundDuration + returnDuration) / 3600;

        const fuelFee = totalDistanceMiles * 0.56;
        const timeFee = totalDurationHours * 13.23;
        const lateFee = (returnDuration / 3600) > 1 ? 136 : 0;
        const tollFee = (outbound.fare?.value || 0) + (returnTrip.fare?.value || 0);

        travelFee += fuelFee + timeFee + lateFee + tollFee;
      } catch (e) {
        console.warn("⚠️ travel fetch failed (MU):", e?.message || e);
      }
    }
  }

  const totalPrice = Math.ceil((fee + travelFee) / 0.75);

  // 🧾 logging
  console.log(`🧾 PRICING BREAKDOWN for ${act.name}`);
  console.log(`• Essential Fee Total: £${fee.toFixed(2)}`);
  console.log(`• Travel Fee Total: £${travelFee.toFixed(2)}`);
  console.log(`• Margin (25%): £${((fee + travelFee) * 0.25).toFixed(2)}`);
  console.log(`• Final Price: £${totalPrice}`);

  return `${totalPrice}`;
};

export default calculateActPricing;