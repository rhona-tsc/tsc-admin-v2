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
