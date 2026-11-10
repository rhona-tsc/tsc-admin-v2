import { readFileSync } from 'node:fs';
const timeout = () => AbortSignal.timeout(20000);
const get = (url, options = {}) => fetch(url, { signal: timeout(), ...options });
const asset = html => [...html.matchAll(/<script[^>]+src="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
const adminUrl = 'https://admin.thesupremecollective.co.uk';
const publicUrl = 'https://thesupremecollective.co.uk';
const apiUrl = 'https://tsc-backend-v2.onrender.com/api/deputy-jobs';
const privateFields = new Set(['clientName','clientEmail','clientPhone','createdByEmail','createdByPhone','stripeCustomerId','defaultPaymentMethodId','applications','matchedMusicians','notifications','notes']);
const findings = value => {
  const names = new Set();
  const inspect = item => {
    if (!item || typeof item !== 'object') return;
    for (const [key, nested] of Object.entries(item)) {
      if (privateFields.has(key)) names.add(key);
      if (nested && typeof nested === 'object') inspect(nested);
    }
  };
  inspect(value);
  return [...names].sort();
};
const admin = await get(adminUrl + '/deputy-jobs');
const html = await admin.text();
console.log(JSON.stringify({service:'admin', status:admin.status, assets:asset(html), expectedAssets:asset(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')), noindex:admin.headers.get('x-robots-tag'), csp:admin.headers.get('content-security-policy'), referrer:admin.headers.get('referrer-policy')}));
const robots = await get(adminUrl + '/robots.txt');
console.log(JSON.stringify({service:'admin-robots',status:robots.status,type:robots.headers.get('content-type'),isTextFile:(await robots.text()).includes('User-agent: *')}));
const listing = await get(apiUrl);
const data = await listing.json();
console.log(JSON.stringify({service:'backend-list',status:listing.status,noindex:listing.headers.get('x-robots-tag'),cache:listing.headers.get('cache-control'),jobCount:data.jobs?.length,privateFields:findings(data),publicShape:data.jobs?.every(job => typeof job.isReadyForApplications === 'boolean' && typeof job.postedByLabel === 'string')}));
if (data.jobs?.[0]?._id) {
  const path = apiUrl + '/' + data.jobs[0]._id;
  const response = await get(path);
  const detail = await response.json();
  const matches = await get(path + '/matches');
  const applications = await get(path + '/applications');
  console.log(JSON.stringify({service:'backend-detail',status:response.status,privateFields:findings(detail),anonymousMatches:matches.status,anonymousApplications:applications.status}));
}
const home = await get(publicUrl + '/');
const homeHtml = await home.text();
const sitemap = await get(publicUrl + '/sitemap.xml');
const xml = await sitemap.text();
const artist = await get(publicUrl + '/act/the-monstars/');
const artistHtml = await artist.text();
console.log(JSON.stringify({service:'public',status:home.status,assets:asset(homeHtml),sitemapStatus:sitemap.status,urls:(xml.match(/<loc>/g)||[]).length,lastmodCount:(xml.match(/<lastmod>/g)||[]).length,artistStatus:artist.status,initialArtistInformation:artistHtml.includes('aria-label="Band information"'),artistImageMeta:artistHtml.includes('property="og:image"')}));
for (const start of ['http://www.thesupremecollective.co.uk/','http://thesupremecollective.co.uk/','https://www.thesupremecollective.co.uk/','https://thesupremecollective.co.uk/about','https://thesupremecollective.co.uk/bandsforhire/the-riot-dogs','https://thesupremecollective.co.uk/bandsforhire/gotta-be-garage','https://thesupremecollective.co.uk/bandsforhire/riot-dogs','https://thesupremecollective.co.uk/bandsforhire/garage-wedding-bands']) {
  const chain = [];
  let url = start;
  for (let i=0;i<5;i++) {
    const response = await get(url,{redirect:'manual'});
    chain.push({url,status:response.status});
    const location = response.headers.get('location');
    if (!location || response.status < 300 || response.status >= 400) break;
    url = new URL(location,url).href;
  }
  console.log(JSON.stringify({service:'redirect',chain}));
}
