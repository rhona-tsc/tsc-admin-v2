import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('admin initial HTML excludes indexing without JavaScript', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/>/);
});

test('hosting excludes all admin routes from indexing', () => {
  const config = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(config, /\[\[headers\]\]\s+for = "\/\*"\s+\[headers.values\]\s+X-Robots-Tag = "noindex, nofollow"/);
});
