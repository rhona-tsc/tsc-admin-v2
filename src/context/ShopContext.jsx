import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // add this

import calculateActPricing from "../pages/utils/pricing";
import CustomToast from "../components/CustomToast";

import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopProvider = (props) => {
  const navigate = useNavigate();
  const currency = "£";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [acts, setActs] = useState([]);
  const [token, setToken] = useState("");
  const [shortlistItems, setShortlistItems] = useState({});
  const [selectedAddress, setSelectedAddress] = useState(
    sessionStorage.getItem("selectedAddress") || ""
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [state, setState] = useState({
    selectedExtras: [],
    selectedAddress: "",
    selectedDate: "",
    shortlistItems: {},
  });
const [availableMap, setAvailableMap] = useState({});
const [availLoading, setAvailLoading] = useState(false);

  // ✅ Keep sessionStorage in sync with state
  useEffect(() => {
    if (selectedDate) sessionStorage.setItem("selectedDate", selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedAddress)
      sessionStorage.setItem("selectedAddress", selectedAddress);
  }, [selectedAddress]);

  const removeFromCart = (actId, lineupId) => {
    const updated = structuredClone(cartItems);

    if (updated[actId]) {
      delete updated[actId][lineupId];
      if (Object.keys(updated[actId]).length === 0) {
        delete updated[actId]; // if no lineups left, remove act
      }
    }

    setCartItems(updated);
  };

  // Accepts: actId, lineupId, selectedExtras, selectedAfternoonSets, songSuggestions
  const addToCart = async (
    actId,
    lineupId,
    selectedExtras = [],
    selectedAfternoonSets = [],
    songSuggestions = []
  ) => {
    const updated = structuredClone(cartItems);

    // 🧹 Remove any existing entries for this actId
    if (updated[actId]) {
      delete updated[actId];
    }

    const api = (p) => `${backendUrl.replace(/\/+$/, '')}/${String(p).replace(/^\/+/, '')}`;

    // Split extras and ceremony/afternoon sets correctly
    const allSelectedExtras = [];
    const allAfternoonSets = [];

    (selectedExtras || []).forEach((item) => {
      if (["ceremony", "afternoon", "both"].includes(item.type)) {
        allAfternoonSets.push(item);
      } else {
        allSelectedExtras.push(item);
      }
    });

    updated[actId] = {
      [String(lineupId)]: {
        quantity: 1,
        selectedExtras: allSelectedExtras,
        selectedAfternoonSets: [
          ...(selectedAfternoonSets || []),
          ...allAfternoonSets,
        ],
        songSuggestions,
      },
    };

    setCartItems(updated);

    // 🧠 Sync with backend if logged in
    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          {
            actId,
            lineupId,
            selectedExtras: allSelectedExtras,
            selectedAfternoonSets: [
              ...(selectedAfternoonSets || []),
              ...allAfternoonSets,
            ],
            songSuggestions,
          },
          { headers: { token } }
        );
      } catch (err) {}
    }
  };

  // fetch (and cache) availability for a date
const loadAvailabilityForDate = async (dateISO) => {
  const d = String(dateISO || "").slice(0, 10);
  if (!d) return;
  const cacheKey = `availMap:${d}`;

  // try cache first
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") {
        setAvailableMap(parsed);
      }
    }
  } catch {}

  setAvailLoading(true);
  try {
    const base = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
    const url = `${base}/api/v2/availability/acts?date=${encodeURIComponent(d)}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    const j = await r.json();

    // Tri-state map: false = explicitly unavailable, true = explicitly available, undefined = unknown
    const map = {};
    (j.unavailableActIds || []).forEach((id) => { map[id] = false; });
    (j.availableActIds   || []).forEach((id) => { if (!(id in map)) map[id] = true; });

    // simple compat: if only actIds present, treat as available
    if (!j.unavailableActIds && Array.isArray(j.actIds)) {
      j.actIds.forEach((id) => { if (!(id in map)) map[id] = true; });
    }

    // cache
    try { sessionStorage.setItem(cacheKey, JSON.stringify(map)); } catch {}

    setAvailableMap(map);
  } catch (e) {
    console.warn("[avail] load failed:", e?.message || e);
  } finally {
    setAvailLoading(false);
  }
};

// recompute when date changes
useEffect(() => {
  if (selectedDate) loadAvailabilityForDate(selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedDate]);

// convenience helpers
const isActUnavailableForSelectedDate = (actId) =>
  !!selectedDate && availableMap[String(actId)] === false;

const isActAvailableForSelectedDate = (actId) =>
  !!selectedDate && availableMap[String(actId)] === true;


  const getCartCount = () => {
    return Object.values(cartItems).reduce((total, act) => {
      return (
        total +
        Object.values(act).reduce(
          (sum, lineup) => sum + (lineup.quantity || 0),
          0
        )
      );
    }, 0);
  };

  const updateQuantity = (actId, lineupId, quantity) => {
    const updated = structuredClone(cartItems);

    if (quantity > 0) {
      if (!updated[actId]) updated[actId] = {};

      const existingExtras = updated[actId][lineupId]?.selectedExtras || [];
      updated[actId][lineupId] = {
        quantity,
        selectedExtras: existingExtras,
      };
    } else {
      if (updated[actId]) {
        delete updated[actId][lineupId];
        if (Object.keys(updated[actId]).length === 0) {
          delete updated[actId];
        }
      }
    }

    setCartItems(updated);
  };

  const updateExtras = async (actId, lineupId, newExtra) => {
    const updated = structuredClone(cartItems);

    if (updated[actId] && updated[actId][lineupId]) {
      const rawExtras = updated[actId][lineupId].selectedExtras;
      const extras = Array.isArray(rawExtras)
        ? rawExtras
        : rawExtras
        ? [rawExtras]
        : [];

      const exists = extras.find((e) => e.key === newExtra.key);
      if (exists) {
        // 🔥 If already exists and quantity is 0 ➔ remove it
        if (newExtra.quantity === 0) {
          updated[actId][lineupId].selectedExtras = extras.filter(
            (e) => e.key !== newExtra.key
          );
        } else {
          // 🔥 If already exists and quantity > 0 ➔ update it
          updated[actId][lineupId].selectedExtras = extras.map((e) =>
            e.key === newExtra.key
              ? { ...e, price: newExtra.price, quantity: newExtra.quantity }
              : e
          );
        }
      } else {
        // 🔥 If doesn't exist ➔ add it
        if (newExtra.quantity > 0) {
          updated[actId][lineupId].selectedExtras = [...extras, newExtra];
        }
      }

      setCartItems(updated);

      if (token) {
        try {
          await axios.post(
            backendUrl + "/api/cart/update",
            {
              actId,
              lineupId,
              quantity: updated[actId][lineupId].quantity,
              selectedExtras: updated[actId][lineupId].selectedExtras,
            },
            { headers: { token } }
          );
        } catch (err) {}
      }
    }
  };

  const getCartAmount = async () => {
    let totalAmount = 0;

    for (const actId in cartItems) {
      const actData = acts.find((act) => act._id === actId);
      if (!actData) continue;

      for (const lineupId in cartItems[actId]) {
        const cartItem = cartItems[actId][lineupId];
        const {
          quantity,
          selectedExtras = [],
          selectedAfternoonSets = [],
        } = cartItem;

        const lineup = actData.lineups.find((l) => l.lineupId === lineupId);
        if (!lineup) continue;

        const priceStr = await calculateActPricing(
          actData,
          selectedAddress?.split(",").slice(-2)[0]?.trim() || "", // selectedCounty
          selectedAddress,
          selectedDate,
          lineup
        );

        const basePrice = Number(priceStr);
        const allExtras = [...selectedExtras, ...selectedAfternoonSets];
        const extrasTotal = allExtras.reduce(
          (sum, e) => sum + (e.price || 0),
          0
        );
        const itemTotal = (basePrice + extrasTotal) * quantity;

        totalAmount += itemTotal;
      }
    }

    return Math.ceil(totalAmount);
  };

  const getActsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/act/list");
      if (response.data.success) {
        setActs(response.data.acts.reverse());
      } else {
        toast(<CustomToast type="error" message={response.data.message} />);
      }
    } catch (error) {
      toast(<CustomToast type="error" message={error.message} />);
    }
  };

  const getUserCart = async (token) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      toast(<CustomToast type="error" message={error.message} />);
    }
  };

  useEffect(() => {
    getActsData();
  }, []);

  // useEffect(() => {
  //     if (!token && localStorage.getItem('token')) {
  //        setToken(localStorage.getItem('token'))
  //        getUserCart(localStorage.getItem('token'))
  //     }
  //    if (token) {
  //        getUserCart(token)
  //}
  //   }, [token])

  const addToShortlist = async (itemId, selectedLineup) => {
    // 🔒 require login
    const storedUser = localStorage.getItem("user");
    const hasUser = !!storedUser; // or check `token` if you prefer

    if (!hasUser) {
      // remember where the user was, then send them to login
      const next = window.location.pathname + window.location.search;
      sessionStorage.setItem("postLoginNext", next);
      navigate("/login");
      return;
    }

    // ✅ proceed as before
    const shortlistData = structuredClone(shortlistItems);
    shortlistData[itemId] = { [selectedLineup]: 1 };
    setShortlistItems(shortlistData);
  };

  const getShortlistCount = () => {
    return Object.values(shortlistItems).reduce((total, act) => {
      return total + Object.values(act).reduce((sum, count) => sum + count, 0);
    }, 0);
  };

  const getShortlistCountForAct = (actId) => {
    if (!shortlistItems[actId]) return 0;
    return Object.values(shortlistItems[actId]).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const updateShortlistQuantity = (itemId, newLineup, quantity) => {
    let shortlistData = structuredClone(shortlistItems);

    if (quantity > 0) {
      // ✅ Update quantity for existing item
      if (!shortlistData[itemId]) {
        shortlistData[itemId] = {};
      }
      shortlistData[itemId][newLineup] = quantity;
    } else {
      // ✅ Remove item completely if quantity is 0
      delete shortlistData[itemId];
    }

    setShortlistItems(shortlistData);
  };

  const formatDateToWords = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();

    const getSuffix = (n) => {
      if ([11, 12, 13].includes(n % 100)) return "th";
      return ["st", "nd", "rd"][(n % 10) - 1] || "th";
    };

    return `${day}${getSuffix(day)} ${month} ${year}`;
  };

  const isShortlisted = (actId) => {
    return !!shortlistItems[actId];
  };

 const toggleShortlist = async (actId, lineup) => {
  const act = acts.find((a) => a._id === actId);
  const isAlreadyShortlisted = shortlistItems[actId];

  // helper: join backend base + path safely
  const api = (p) =>
    `${(backendUrl || "").replace(/\/+$/, "")}/${String(p).replace(/^\/+/, "")}`;

  if (isAlreadyShortlisted) {
    const updated = { ...shortlistItems };
    delete updated[actId];
    setShortlistItems(updated);
    return;
  }

  const newShortlist = { ...shortlistItems, [actId]: { [lineup]: 1 } };
  setShortlistItems(newShortlist);

  // ✅ Send WhatsApp message
  try {
    const vocalRoles = [
      "Lead Male Vocal",
      "Lead Female Vocal",
      "Lead Vocal",
      "vocalist-guitarist",
    ];

    // Biggest lineup by number of members
    const largestLineup = act.lineups.reduce(
      (a, b) => (b.bandMembers?.length || 0) > (a.bandMembers?.length || 0) ? b : a,
      act.lineups[0]
    );

    const vocalists = (largestLineup.bandMembers || []).filter((m) =>
      vocalRoles.includes(m.instrument)
    );

    const recipients =
      vocalists.length > 0
        ? vocalists
        : [largestLineup.bandMembers?.[0]].filter(Boolean);

    // --- Travel fee calc ----------------------------------------------------
    let travelFee = 0;
    const selectedCounty = selectedAddress.split(",").slice(-2)[0]?.trim() || "";
    const memberPostcodes = recipients.map((m) => m.postCode).filter(Boolean);

    // helper to fetch travel JSON safely and handle HTML errors
    const fetchTravel = async (origin, destination, dateISO) => {
      const url = api(
        `api/v2/travel?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
          destination
        )}&date=${encodeURIComponent(dateISO)}`
      );
      const r = await fetch(url, { headers: { accept: "application/json" } });
      const text = await r.text();
      if (!r.ok) throw new Error(`travel http ${r.status}`);
      // robust JSON parse (avoid HTML 404 pages)
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("travel: invalid JSON");
      }
    };

    if (act.useCountyTravelFee && act.countyFees) {
      const countyKey = selectedCounty.toLowerCase();
      const feePerMember = act.countyFees[countyKey] || 0;
      travelFee = feePerMember * memberPostcodes.length;
    } else if (act.costPerMile > 0) {
      // cost-per-mile path (one-way distance * costPerMile * 2)
      for (const postCode of memberPostcodes) {
        const data = await fetchTravel(postCode, selectedAddress, selectedDate);
        // prefer normalized shape
        const meters =
          data?.outbound?.distance?.value ??
          data?.rows?.[0]?.elements?.[0]?.distance?.value ??
          0;
        const miles = meters / 1609.34;
        travelFee += miles * Number(act.costPerMile || 0) * 2;
      }
    } else {
      // MU-rate path using both legs
      for (const member of recipients) {
        const postCode = member.postCode;
        if (!postCode) continue;

        const data = await fetchTravel(postCode, selectedAddress, selectedDate);
        const outbound = data?.outbound;
        const returnTrip = data?.returnTrip;

        if (!outbound || !returnTrip) continue;

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
          continue;
        }

        const totalDistanceMiles =
          (outboundDistance + returnDistance) / 1609.34;
        const totalDurationHours =
          (outboundDuration + returnDuration) / 3600;

        const fuelFee = totalDistanceMiles * 0.56;
        const timeFee = totalDurationHours * 13.23;
        const lateFee = returnDuration / 3600 > 1 ? 136 : 0;
        const tollFee =
          (outbound.fare?.value || 0) + (returnTrip.fare?.value || 0);

        travelFee += fuelFee + timeFee + lateFee + tollFee;
      }
    }

    const baseFee = largestLineup?.base_fee?.[0]?.total_fee || 0;
    const total = Math.ceil(baseFee + travelFee); // no margin for WhatsApp quote
    const formattedDate = formatDateToWords(selectedDate);

    // shorten address to last two parts
    let shortAddress = selectedAddress.split(",").slice(-2).join(",").trim();
    if (shortAddress.toLowerCase().endsWith(", uk")) {
      shortAddress = shortAddress.replace(/,\s*UK$/i, "");
    }

    for (const member of recipients) {
      const message = `Hey ${member.firstName}! Are you available for a gig on ${formattedDate} in ${shortAddress} for £${total}? Reply: 
YES, 
NO (i.e. I'm available for this date just not for this location), or 
UNAVAILABLE.`;

      await axios.post(api("api/shortlist/notify-musician"), {
        phone: member.phoneNumber,
        message,
      });
    }
  } catch (err) {
    // swallow (non-fatal for UI), but log for debugging
    console.warn("toggleShortlist notify error:", err?.message || err);
  }
};

  const [shortlistedActs, setShortlistedActs] = useState([]);

  const fetchShortlistedActs = async (userId) => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/user/${userId}/shortlisted`
      );
      if (res.data.success) setShortlistedActs(res.data.acts);
    } catch (err) {}
  };

  const shortlistAct = async (userId, actId) => {
    try {
      const res = await axios.post(`/api/shortlist`, { userId, actId });
      if (res.data.success) {
        setShortlistedActs((prev) =>
          prev.includes(actId)
            ? prev.filter((id) => id !== actId)
            : [...prev, actId]
        );
      }
    } catch (err) {}
  };

  const value = {
    acts,
    currency,
    delivery_fee,
    cartItems,
    addToCart,
    updateQuantity,
    updateExtras,
    getCartCount,
    getCartAmount,
    shortlistItems,
    addToShortlist,
    updateShortlistQuantity,
    selectedAddress,
    setSelectedAddress,
    selectedDate,
    setSelectedDate,
    getShortlistCount,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    backendUrl,
    toggleShortlist,
    isShortlisted,
    state,
    setState,
    removeFromCart,
    setToken,
    token,
    setCartItems,
    shortlistedActs,
    shortlistAct,
    fetchShortlistedActs,

  availableMap, availLoading,
  isActUnavailableForSelectedDate,
  isActAvailableForSelectedDate,
  loadAvailabilityForDate,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopProvider;
