import assert from 'node:assert/strict';
const origin = 'https://thesupremecollective.co.uk';
const response = await fetch(origin + '/sitemap.xml', { signal: AbortSignal.timeout(20000) });
assert.equal(response.status, 200);
const xml = await response.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.ok(urls.length >= 51);
assert.equal(new Set(urls).size, urls.length);
let checked = 0;
let artists = 0;
const artistsMissingShortDescription = [];
for (let start = 0; start < urls.length; start += 4) {
  await Promise.all(urls.slice(start, start + 4).map(async url => {
    assert.ok(url.startsWith(origin + '/'));
    const page = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert.equal(page.status, 200, new URL(url).pathname);
    assert.ok(!page.headers.get('x-robots-tag')?.includes('noindex'), new URL(url).pathname);
    const html = await page.text();
    assert.ok(html.includes(`rel="canonical" href="${url}"`), new URL(url).pathname);
    const raw = html.match(/<script id="initial-page-schema"[^>]*>(.*?)<\/script>/s)?.[1];
    assert.ok(raw, new URL(url).pathname);
    const schema = JSON.parse(raw);
    assert.ok(schema['@graph'].length >= 3);
    assert.ok(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html));
    if (new URL(url).pathname.startsWith('/act/')) {
      artists++;
      assert.ok(html.includes('aria-label="Band information"'), new URL(url).pathname);
      const group = schema['@graph'].find(item => item['@type'] === 'MusicGroup');
      assert.ok(group?.name && group.url === url && group.image, new URL(url).pathname);
      // A group description is optional. Missing approved copy is a content task,
      // not a reason to manufacture text or fail an otherwise valid deployment.
      if (!group.description) artistsMissingShortDescription.push(new URL(url).pathname);
    }
    checked++;
  }));
}
console.log(JSON.stringify({ checked, artists, canonicalUrls:true, structuredData:true, indexable:true, initialArtistInformation:true, lastmodCount:(xml.match(/<lastmod>/g)||[]).length, artistsMissingShortDescription }));
