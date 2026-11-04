# Cloudinary delivery audit — 4 November 2026

Changes are prepared locally for review. Nothing has been deployed, uploaded, deleted, migrated, or committed.

## Repository scope

| Application | Checkout |
| --- | --- |
| Admin | `/Users/rhonadownie/Desktop/tsc2025/admin/tsc-admin-v2` |
| Public website | `/Users/rhonadownie/Desktop/tsc2025/tsc-frontend-v2/frontend-import` |
| Client portal | `/Users/rhonadownie/Desktop/tsc2025/frontend` |
| Current backend | `/Users/rhonadownie/Desktop/tsc2025/admin/tsc-backend-v2` |

Selected these from their current source, Git remotes and November 2026 history. Older backend/admin copies and the outer repository containers were inspected but left unchanged. No AGENTS.md files were found in the project tree or ancestor directories. Existing unrelated source edits, untracked London-page components and public-site `dist` output have been preserved. Builds ran in temporary directories; the complete public render ran in an isolated copy.

## Findings and changes

- Many cards, galleries, profile photos, upload previews, venue photos and email images used original image URLs, even when CSS displayed a small thumbnail.
- Existing optimisation was spread across card, hero and gallery helpers. Some inserted resizing before saved pixel crops; some only checked for `/upload/`, which could match another host or Cloudinary video.
- Each independently deployed app now has the same dependency-free `cloudinaryImage` delivery helper. It appends `c_limit,w_<width>/q_auto/f_auto` after existing transformation steps. It does not flatten transparency, add backgrounds, introduce crops, change gravity or stretch aspect ratios. High-quality `q_90`–`q_100` and `q_auto:best` inputs retain a best-quality automatic preference.
- Fixed thumbnails use roughly twice their CSS width; cards use up to 960px, ordinary image displays up to 1200px, and full-size gallery views up to 1920px. `c_limit` prevents upscaling. Existing hero crops, responsive candidates, blurred placeholders and matching preloads remain in use.
- The public `bandImageDelivery` helper delegates to the shared policy. Responsive candidates remain available when the input is already optimised. Repeated calls do not accumulate the helper's suffix.
- Backend location cards, email vocalist photos, band email heroes, review badges, social icons and the contract logo now have bounded optimised delivery. Email photos and icons use sizes appropriate to their displayed widths.
- Upload endpoints and original `secure_url` persistence remain unchanged. Crop editors still receive their original source and save original-coordinate crop data. Download anchors, signed/private original download generation, PDF attachments, contract signatures and raw documents remain unchanged.
- The helper only accepts the exact Cloudinary delivery hostname and `image/upload` resource path. Other hosts, video/audio/raw resources, audio/video extensions, signed paths and attachment URLs pass through. SVG/PDF/design-document originals are intentionally excluded.

## Live delivery verification

Tested actual account `dvcgr3fyd` assets using explicit WebP and PNG/JPEG fallback Accept headers. Every request returned HTTP 200 without a Cloudinary error. Decoded the delivered files and visually compared the photo, thumbnail and logo.

| Sample | Original | Optimised WebP | Fallback | Delivered dimensions |
| --- | ---: | ---: | ---: | --- |
| Gotta Be Garage band photo | 1,000,641 bytes | 60,378 bytes (94% less) | JPEG, 91,483 bytes | 1200 × 800 |
| Same photo, admin thumbnail | 1,000,641 bytes | 4,498 bytes (99.6% less) | JPEG, 6,788 bytes | 192 × 128 |
| Transparent TSC contract logo | 119,416 bytes | 6,086 bytes (94.9% less) | PNG, 7,063 bytes | 600 × 150 |

Original photo: 1390 × 927. Original logo: 2000 × 500. Both optimised logo variants retained a decoded alpha range of 0–255, including fully transparent pixels. Photo composition and logo proportions were preserved. Savings are sample measurements, not a forecast of total account savings.

Temporary evidence: `/tmp/tsc-cloudinary-audit/live-results.json` and `/tmp/tsc-cloudinary-audit/comparison.png`.

## Checks

- Admin production build: passed; delivery regression tests: 6 passed.
- Public website: 93 utility tests passed; complete production build rendered and verified all 51 sitemap pages, including initial content, schemas and published images.
- Client portal: production build passed; 20 tests passed.
- Backend image/crop/history regression checks: 13 passed. The complete backend suite has two unrelated cancellation-date assertions expecting `5 June 2027` while the existing implementation emits `5th June 2027`; the relevant booking-board implementation is unchanged.
- New image helpers and public delivery tests pass targeted ESLint checks. Full-repository lint remains blocked by existing errors (including unused variables, prop validation, hook warnings and unused legacy files). The broader lint logs and comparison against HEAD are in `/tmp/tsc-cloudinary-audit/`.
- Diff whitespace checks pass for the image changes. The portal has existing trailing whitespace in its unrelated `src/App.jsx` change, which was left intact.

## Remaining considerations

- The supplied current usage, 13.14 of 25 credits, leaves 11.86 credits. This audit did not authenticate to the Cloudinary console or independently verify billing usage.
- New derived sizes/formats consume transformations and derived storage when first requested. The changes avoid bulk eager generation, explicit DPR multipliers and cache-warming runs. Review usage after deployment; bandwidth savings do not guarantee the whole account stays below 25 credits.
- Existing Cloudinary originals and derivatives remain stored. Older generated HTML, deployed bundles, cached emails and externally shared original URLs only improve when new content/URLs are deployed or sent.
- Automatic quality is perceptual compression. Visual checks passed for representative samples; original downloads remain available for exact source fidelity. Mail-client-specific rendering and every image in the account were not exhaustively tested.
- Large local PNG assets also exist in the apps; they are not Cloudinary delivery and were left outside this change.
- Deploy the four app/backend changes through the normal review process. Monitor bandwidth, transformations and total credits over the next usage period before considering further reductions.

## Documentation checked

- [Cloudinary image optimisation](https://cloudinary.com/documentation/image_optimization): delivery-time `q_auto` and `f_auto`, appropriate image sizes, transparency-aware format selection, exact-original exceptions, and derived format/storage tradeoffs.
- [Transformation reference](https://cloudinary.com/documentation/transformation_reference): `c_limit` preserves aspect ratio and avoids upscaling.

The helper uses separate `/q_auto/f_auto` transformation components, following the current documentation. Existing URL-string tests were updated to reflect that syntax while retaining their crop-order assertions.
