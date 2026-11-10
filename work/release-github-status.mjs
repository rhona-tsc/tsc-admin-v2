import { execFileSync } from 'node:child_process';

// Reuse the configured Git credential helper in memory; never print credentials.
const raw = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\npath=rhona-tsc/tsc-admin-v2.git\n\n', encoding: 'utf8',
});
const fields = Object.fromEntries(raw.trim().split('\n').map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));
const headers = {
  Authorization: 'Basic ' + Buffer.from(fields.username + ':' + fields.password).toString('base64'),
  Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
};
const repo = process.argv[2];
const sha = process.argv[3] || 'main';
if (!['tsc-admin-v2', 'tsc-backend-v2', 'frontend-import'].includes(repo)) throw new Error('Unexpected release repository');
const api = `https://api.github.com/repos/rhona-tsc/${repo}`;
for (const [name, path] of [
  ['checks', `/commits/${sha}/check-runs`],
  ['deployments', '/deployments?per_page=3'],
]) {
  const response = await fetch(api + path, { headers, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) { console.log(JSON.stringify({ repo, name, status: response.status })); continue; }
  if (name === 'checks') {
    console.log(JSON.stringify({ repo, checks: data.check_runs.map(item => ({ name: item.name, status: item.status, conclusion: item.conclusion, url: item.details_url, title: item.output?.title, summary: item.output?.summary })) }));
  } else {
    for (const item of data) {
      const result = await fetch(item.statuses_url, { headers });
      const statuses = result.ok ? await result.json() : [];
      console.log(JSON.stringify({ repo, deployment: { id: item.id, sha: item.sha, environment: item.environment, createdAt: item.created_at, statuses: statuses.slice(0, 2).map(status => ({ state: status.state, description: status.description, url: status.environment_url || status.target_url })) } }));
    }
  }
}
