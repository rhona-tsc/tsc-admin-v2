import axios from 'axios';

export const getDrivingData = async (fromPostcode, toPostcode) => {
  try {
    const base = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
    const url = `${base}/api/v2/travel`;
    const date = new Date().toISOString().slice(0, 10);

    const response = await axios.get(url, {
      params: { origin: fromPostcode, destination: toPostcode, date },
      headers: { accept: "application/json" },
      withCredentials: false,
    });

    const data = response?.data;

    if (!data || typeof data !== "object") {
      console.warn("⚠️ Invalid travel data response:", data);
      return { distance: 0, duration: 0 };
    }

    // Prefer new v2 structure
    let distanceMeters =
      data?.outbound?.distance?.value ??
      data?.rows?.[0]?.elements?.[0]?.distance?.value ??
      0;

    let durationSeconds =
      data?.outbound?.duration?.value ??
      data?.rows?.[0]?.elements?.[0]?.duration?.value ??
      0;

    const distanceInMiles = distanceMeters / 1609.34;
    const durationInMinutes = durationSeconds / 60;

    const src = data?.sources?.outbound || "unknown";
    console.log(`🧭 Travel v2 fetched: ${distanceInMiles.toFixed(1)} mi, ${durationInMinutes.toFixed(0)} mins (src: ${src})`);

    return {
      distance: distanceInMiles,
      duration: durationInMinutes,
      source: src,
    };
  } catch (error) {
    console.error('🚨 Error getting driving data:', error?.message || error);
    return {
      distance: 0,
      duration: 0,
    };
  }
};