export const plannedMasterShares = (roles = []) => {
  const named = roles.filter(role => role.name?.trim());
  return [
    { role: 'TSC', percent: 20 }, { role: 'Project owner', percent: 20 },
    ...(named.length ? named.map(role => ({ role: role.name, percent: 40 / named.length })) : [{ role: 'Contributors (not yet assigned)', percent: 40 }]),
    { role: 'Mix producer', percent: 10 }, { role: 'Mastering engineer', percent: 10 },
  ];
};
export const royaltyAmount = (income, percent) => {
  const amount = Number(income);
  return Number.isFinite(amount) && amount >= 0 ? Math.min(amount, 1e9) * Number(percent || 0) / 100 : 0;
};

const fixedColors = {
  tsc: '#334155',
  'project owner': '#e05265',
  songwriter: '#e05265',
  'mix producer': '#0891b2',
  'mastering engineer': '#ca8a04',
};
const roleColors = ['#047857', '#1d4ed8', '#7e22ce', '#b45309', '#0f766e', '#a21caf', '#65a30d', '#be123c'];
export const royaltyColor = (role, requestedRoles = []) => {
  const name = String(role || '').trim().toLowerCase();
  if (fixedColors[name]) return fixedColors[name];
  const instrument = name.replace(/^songwriter\s*[—–-]\s*/, '');
  let index = requestedRoles.findIndex(item => String(item.name || '').trim().toLowerCase() === instrument);
  if (index < 0) index = [...instrument].reduce((hash, letter) => (hash * 31 + letter.charCodeAt(0)) >>> 0, 0);
  return index < roleColors.length ? roleColors[index] : `hsl(${(index * 137.508) % 360} 65% 36%)`;
};

// This is an editable arithmetic assumption, not a platform payout rate or a forecast.
export const streamsForAnnualIncome = (income, assumedIncomePerStream) => {
  const amount = Number(income), rate = Number(assumedIncomePerStream);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const streams = Math.ceil(Math.min(amount, 1e9) / rate);
  return Number.isSafeInteger(streams) ? streams : null;
};
