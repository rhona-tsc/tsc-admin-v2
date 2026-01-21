import fs from "fs";
import Fuse from "fuse.js";

/**
 * Safe fuzzy dedupe:
 * - Artist must match after normalization (so Aretha vs Dionne won't merge)
 * - Within each artist group, fuzzy match titles
 * - Prefer entries with year + genre present
 */

const IN_JSON = "songs_merged.json";
const OUT_JSX = "songsData.generated.jsx";
const OUT_REPORT = "songsDedupe.report.json";

const raw = JSON.parse(fs.readFileSync(IN_JSON, "utf8"));

const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ") // keep alnum, collapse punctuation
    .replace(/\s+/g, " ")
    .trim();

const normKey = (s) => norm(s).replace(/\s+/g, "");

const cleanYear = (y) => {
  if (typeof y === "number" && Number.isFinite(y)) return y;
  if (typeof y === "string" && /^\d{4}$/.test(y.trim())) return Number(y.trim());
  return null;
};

const cleaned = raw
  .map((s) => ({
    year: cleanYear(s.year),
    title: String(s.title ?? "").trim(),
    artist: String(s.artist ?? "").trim(),
    genre: String(s.genre ?? "").trim(),
  }))
  // must have title + artist
  .filter((s) => s.title && s.artist);

for (const s of cleaned) {
  s.titleNorm = norm(s.title);
  s.artistNorm = normKey(s.artist);
}

// Group by artistNorm (hard requirement)
const byArtist = new Map();
for (const s of cleaned) {
  if (!byArtist.has(s.artistNorm)) byArtist.set(s.artistNorm, []);
  byArtist.get(s.artistNorm).push(s);
}

// scoring: pick best representative for a cluster
const score = (s) => {
  let pts = 0;
  if (s.year != null) pts += 10;
  if (s.genre) pts += 5;
  // slightly prefer longer/less-truncated titles
  pts += Math.min(3, Math.floor(s.title.length / 20));
  return pts;
};

// Fuse options (title-only fuzzy inside same artist)
const fuseOptions = {
  includeScore: true,
  keys: ["titleNorm"],
  threshold: 0.18, // tighter = safer (0.15–0.25 good range)
  ignoreLocation: true,
  minMatchCharLength: 5,
};

const canonical = [];
const report = {
  inputCount: cleaned.length,
  byArtistCount: byArtist.size,
  clusters: [],
  mergedAway: 0,
};

for (const [artistNorm, songs] of byArtist.entries()) {
  // dedupe exact titleNorm quickly first
  const exactMap = new Map();
  for (const s of songs) {
    const k = `${artistNorm}||${normKey(s.title)}`;
    if (!exactMap.has(k)) exactMap.set(k, []);
    exactMap.get(k).push(s);
  }

  // Convert exact groups into “seed clusters”
  const seeds = [];
  for (const group of exactMap.values()) {
    // choose best within exact group
    let best = group[0];
    for (const g of group) if (score(g) > score(best)) best = g;
    seeds.push({ best, members: group });
  }

  // Now fuzzy merge seeds by title (within artist)
  const remaining = [...seeds];
  const fuse = new Fuse(
    remaining.map((c) => ({ titleNorm: c.best.titleNorm })),
    fuseOptions
  );

  const used = new Set();

  for (let i = 0; i < remaining.length; i++) {
    if (used.has(i)) continue;

    const base = remaining[i];
    const baseTitleNorm = base.best.titleNorm;

    const matches = fuse.search({ titleNorm: baseTitleNorm });
    const clusterIdxs = [];

    for (const m of matches) {
      const idx = m.refIndex;
      if (!used.has(idx)) clusterIdxs.push(idx);
    }

    // Build cluster (base + fuzzy matches)
    const cluster = [];
    for (const idx of clusterIdxs) {
      used.add(idx);
      cluster.push(...remaining[idx].members);
    }

    // pick canonical item from cluster
    let best = cluster[0];
    for (const c of cluster) if (score(c) > score(best)) best = c;

    // cluster size bookkeeping
    report.mergedAway += Math.max(0, cluster.length - 1);

    canonical.push({
      year: best.year ?? null,
      title: best.title,
      artist: best.artist,
      genre: best.genre,
    });

    if (cluster.length > 1) {
      report.clusters.push({
        artist: best.artist,
        canonical: { title: best.title, year: best.year ?? null, genre: best.genre },
        merged: cluster
          .filter((x) => x !== best)
          .map((x) => ({ title: x.title, year: x.year ?? null, genre: x.genre })),
      });
    }
  }
}

// Final clean, sort, and write outputs
canonical.sort((a, b) => {
  const ay = a.year ?? 9999;
  const by = b.year ?? 9999;
  return ay - by || a.title.localeCompare(b.title) || a.artist.localeCompare(b.artist);
});

const lines = canonical.map(
  (s) =>
    `  { year: ${s.year === null ? "null" : s.year}, title: ${JSON.stringify(
      s.title
    )}, artist: ${JSON.stringify(s.artist)}, genre: ${JSON.stringify(s.genre)} },`
);

const fileBody =
  `// AUTO-GENERATED from songs_merged.json (safe fuzzy dedupe: artist-normalized must match)\n` +
  `export const songsData = [\n` +
  lines.join("\n") +
  `\n];\n`;

fs.writeFileSync(OUT_JSX, fileBody, "utf8");
fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), "utf8");

console.log(`✅ Input songs: ${cleaned.length}`);
console.log(`✅ Canonical songs: ${canonical.length}`);
console.log(`✅ Wrote: ${OUT_JSX}`);
console.log(`🧾 Dedupe report: ${OUT_REPORT} (clusters merged: ${report.clusters.length})`);