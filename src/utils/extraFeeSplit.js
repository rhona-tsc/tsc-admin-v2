export function balanceExtraFeeSplit(extra, field, value) {
  const total = Math.max(0, Math.round(Number(extra.price || 0) * (Number(extra.quantity || 1) || 1) * 100) / 100);
  const amount = Math.min(total, Math.max(0, Number(value) || 0));
  const other = field === 'passThroughGross' ? 'managementGross' : 'passThroughGross';
  return { [field]: amount, [other]: Math.round((total - amount) * 100) / 100 };
}
