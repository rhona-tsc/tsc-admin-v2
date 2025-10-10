// backend/utils/enrichSong.js
import axios from "axios";

export const enrichSongDetails = async (song) => {
  const enriched = { ...song };

  // Skip if all fields are already present
  if (song.artist && song.genre && song.year) return enriched;

  try {
    const query = `${song.title} ${song.artist || ""}`.trim();

    // Example API fallback: MusicBrainz or any internal logic
    const res = await axios.get(
      `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json&limit=1`
    );

    if (res.data.recordings && res.data.recordings.length > 0) {
      const match = res.data.recordings[0];
      enriched.artist = enriched.artist || (match["artist-credit"]?.[0]?.name || "");
      enriched.year = enriched.year || (match["first-release-date"]?.split("-")[0] || null);
    }

    // Optional: genre enrichment logic here
  } catch (err) {
    console.warn("🎵 Could not enrich song:", song.title, err.message);
  }

  return enriched;
};
