export function recordingOrderError(roles) {
  const used = new Set();
  for (const role of roles) {
    if (role.recordingOrder === '' || role.recordingOrder == null) continue;
    const number = Number(role.recordingOrder);
    if (!Number.isInteger(number) || number < 1 || number > 30 || used.has(number)) return 'Use a different whole number from 1 to 30 for each preferred recording order, or leave it blank.';
    used.add(number);
  }
  return '';
}

export function sortRecordingProgress(roles) {
  const group = role => role.timingState === 'complete' ? 0 : role.isCurrent ? 1 : 2;
  return roles.map((role, index) => ({ role, index })).sort((a, b) => group(a.role) - group(b.role) || (a.role.recordingOrder ?? Infinity) - (b.role.recordingOrder ?? Infinity) || a.index - b.index).map(item => item.role);
}
