const deadlineFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
});

export const formatOriginalsDeadline = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? deadlineFormat.format(date) : '';
};

// Use actual active reservation deadlines, including any approved extensions.
export const originalsRoleDeadlineRange = (slots = []) => {
  const active = slots.filter(slot => slot.state === 'active' && formatOriginalsDeadline(slot.expectedBy))
    .sort((a, b) => new Date(a.expectedBy) - new Date(b.expectedBy));
  return active.length ? { earliest: active[0].expectedBy, latest: active.at(-1).expectedBy, count: active.length } : null;
};
