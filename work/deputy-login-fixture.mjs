// Local browser verification only. No production services or records are used.
import http from 'node:http';
const userId = '507f1f77bcf86cd799439011';
const job = {
  _id: '507f1f77bcf86cd799439012', title: 'Local login test job', status: 'open',
  eventDate: '2027-12-31', jobType: 'enquiry', fee: 400, deputyNetAmount: 400,
  currency: 'GBP', venue: 'Example public venue', requiredInstruments: ['Saxophone'],
  roleRequirements: [{ role: 'Saxophone', quantity: 1 }], roleAllocations: [],
  isReadyForApplications: true, postedByLabel: 'The Supreme Collective',
};
const token = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({
  id: userId, email: 'test@example.test', role: 'musician', exp: Math.floor(Date.now()/1000) + 3600,
})).toString('base64url'), 'local-fixture'].join('.');
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4180');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end(); return; }
  const url = new URL(req.url, 'http://localhost:4181');
  if (/^\/api\/musician-login\/(login|register)$/.test(url.pathname) && req.method === 'POST') {
    res.end(JSON.stringify({ success: true, token, userId, role: 'musician', email: 'test@example.test', firstName: 'Local', lastName: 'Tester' }));
  } else if (url.pathname === '/api/deputy-jobs') {
    res.end(JSON.stringify({ success: true, jobs: [job] }));
  } else if (url.pathname === `/api/deputy-jobs/${job._id}`) {
    res.end(JSON.stringify({ success: true, job }));
  } else if (req.method === 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, message: 'The local fixture never submits applications or changes records.' }));
  } else {
    res.end(JSON.stringify({ success: true, acts: [], jobs: [], applications: [], musician: { _id: userId } }));
  }
}).listen(4181, '127.0.0.1', () => console.log('Local deputy login fixture ready on port 4181'));
