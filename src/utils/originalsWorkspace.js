export function openWorkspaceSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  let parent = target;
  while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}
