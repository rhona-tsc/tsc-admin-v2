export function openWorkspaceSection(id) {
  if (id === 'project-chat') { window.dispatchEvent(new Event('originals:open-chat')); return; }
  const target = document.getElementById(id);
  if (!target) return;
  let parent = target;
  while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}
