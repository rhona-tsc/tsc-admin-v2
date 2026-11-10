# Search and deputy-job changes — 10 November 2026

Status: implementation validated; release authorised by the user on 10 November 2026. Publication is in progress and must be verified against each live service.

## Confirmed product behaviour

The deputy-job list and individual adverts intentionally remain public. Login is required to apply. Both login and account creation return visitors to their originating list or job URL, including its query and fragment. The destination is stored in a validated `next` query parameter so a login-page refresh does not lose it. Authentication never submits an application automatically.

The public advert fields include the job title, event date/times, advertised venue/location, instruments, requirements and advertised fee. Publishers must put only information intended for the public in these advert fields. Client contacts, payment identifiers, internal notes and other applicants' identities are excluded from public and unrelated-musician API responses. A musician can still see their own application status. Job owners and staff retain management access.

## Repositories and conventions

- Admin: `/Users/rhonadownie/Desktop/tsc2025/admin/tsc-admin-v2`, origin `rhona-tsc/tsc-admin-v2`, branch `main`. Netlify builds with Vite and publishes `dist`.
- Backend: `/Users/rhonadownie/Desktop/tsc2025/admin/tsc-backend-v2`, origin `rhona-tsc/tsc-backend-v2`, branch `main`. Existing public/admin requests use the Render service `tsc-backend-v2.onrender.com`.
- Public site: `/Users/rhonadownie/Desktop/tsc2025/tsc-frontend-v2/frontend-import`, origin `rhona-tsc/frontend-import`, branch `main`. Netlify runs sitemap generation, Vite, public HTML rendering and initial-HTML validation. This repository tracks generated `dist` files; a fresh build therefore changes many generated files.
- The older `/Users/rhonadownie/Desktop/tsc2025/frontend` checkout has unrelated existing changes and was left untouched. Four untracked London component/page files in the current public-site repository also predated this work and were left untouched.

## Changes

### Admin and backend

- Fixed the list login link, one-click apply login handoff, expired-session handoff and job-detail login URLs.
- Kept admin-wide HTTP and HTML `noindex, nofollow` directives. Added a real robots.txt that permits crawling, so crawlers can see noindex. Do not replace this with `Disallow: /` while relying on noindex for removal from search.
- Added an admin CSP limiting framing, objects and base URLs, plus Referrer-Policy and nosniff. It deliberately does not introduce a restrictive script/connect allowlist that could break Stripe, uploads or media.
- Put admin host/protocol redirects above the SPA fallback and removed the broad wildcard-host rule.
- Added an allowlist for public deputy-job responses, including application responses. Removed private client/contact/Stripe fields, internal notes, and other musicians' identities. Preserved public fee and advert-eligibility behaviour without exposing card/customer identifiers.
- Added no-store and noindex headers across the deputy-job API.
- Added server-side owner/staff authorization before all job subroute management actions, matches and applications. The apply route retains its existing authenticated-musician flow. Public Twilio/tracking routes are outside this new gate; their existing validation is unchanged.

### Public site

- Added explicit HTTP/www redirects directly to the HTTPS non-www origin before path rewrites. The production edge may perform an automatic HTTPS redirect before configured rules; live one-hop behaviour still needs checking after deployment. TLS protection must remain enabled.
- Confirmed generated redirects for `/bandsforhire/the-riot-dogs` and `/bandsforhire/gotta-be-garage`. No invented mappings were added for `/bandsforhire/riot-dogs` or garage-wedding-band(s); unknown routes retain a true 404.
- Retained all existing county copy, local venues, evidence-based reviews, FAQs and links. Priority counties remain Surrey, Berkshire, Hertfordshire, Essex, Buckinghamshire, Kent, West Sussex, East Sussex and Oxfordshire.
- Added approved biography, lineup sizes and performance-set information to initial artist HTML, making existing facts readable before JavaScript loads.
- Added artist image/description to MusicGroup schema, public organisation contact fields, source modification times to page schema and artist sitemap entries, and image previews to initial artist/blog metadata.
- Sitemap generation validates and deduplicates published slugs and checks each referenced artist. It fails on missing/mismatched records instead of silently publishing an incomplete sitemap. Requests have timeouts and bounded concurrency.
- Removed ineffective priority/changefreq output. Missing or invalid source modification dates are omitted; builds do not invent fresh timestamps. Blog lastmod is emitted only where an editorial update field exists.
- No unverified social identity links, fabricated review ratings, video dates, prices or universal equipment promises were added. Official social profiles still need verification before adding organisation sameAs. Existing robots/sitemap and crawlable HTML remain the basis for AI/search discovery.

## Validation

- Admin utility/regression suite: 123 tests passed.
- Public utility/regression suite: 114 tests passed.
- Targeted backend tests cover public response filtering, owner/staff access and existing history visibility.
- Actual HTTP route tests check that anonymous list/detail requests remain public and private fields are absent; unrelated musicians receive 403 for management actions, while anonymous protected requests receive 401.
- Admin production build passed. Existing bundle-size, Tailwind scan and browser-data warnings remain.
- Public production build passed, including all 51 sitemap pages and 24 acts. Initial HTML, canonicals, published images and structured data passed the existing verification.
- Browser verification used `work/deputy-login-fixture.mjs` with synthetic data and a local Vite instance: list Apply → login → list; individual job → login → same job; account creation → same job; login refresh preserves destination. No real application was submitted.

## Coordinated release and verification

1. Review and deploy the admin first. It understands the new public eligibility/attribution fields and also supports the previous API shape.
2. Deploy the backend privacy and authorization changes. No database migration is needed. Test an actual owner account, a different musician and a signed-out visitor against the same job. Confirm legitimate managers can still manage their own jobs and unrelated accounts cannot read matches, send notices, allocate, close or invoke payment actions.
3. Deploy the public site separately using its existing build. Check HTTP/www canonical chains, slash behaviour, known historical artist redirects and unknown-path 404s. If Netlify's automatic HTTPS layer still adds a hop, inspect the site's domain/edge configuration rather than weakening HTTPS.
4. Check the live admin headers and robots.txt, and complete a login and sign-up return journey. Review public advert fields and the decision to make free-text notes manager-only.
5. Use Search Console URL inspection and sitemap submission after deployment. Measure changes using comparable date windows.

The user authorised the coordinated release on 10 November 2026. A rollback should restore the preceding reviewed version of the relevant repository. Never reset or discard unrelated local work.

Pre-release Git baselines:

- Admin: `e27d9bce9ed4878509e0dc0efafe4317cb8b3c0c`
- Backend: `0544806e7f185c584f7cb1fbf224f6cd63f2579f`
- Public site: `a65e0f9905111eb2fa9e2239ff66a5966aaba0f4`

Netlify's local CLI session was expired at release preflight; hosting authentication must be restored to inspect and confirm the exact deployment targets. All three Git checkouts matched their remote main branches at preflight. GitHub did not expose prior deployment/check records for those commits, so a successful push alone is not evidence of a successful deployment.

## Advertising

The supplied Search Console Clicks, Impressions, CTR and Position columns describe organic search. They do not measure Google Ads costs or paid conversions. Paid-spend recommendations remain pending the promised Ads export and reconciliation of conversion actions with qualified enquiries/bookings. No advertising settings or spending were changed.

## Reference guidance

- Netlify rule precedence: https://docs.netlify.com/manage/routing/redirects/overview/
- Google noindex and crawling: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Sitemap dates and ignored priority/changefreq: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- AI search follows normal crawlability and content practices: https://developers.google.com/search/docs/appearance/ai-features
