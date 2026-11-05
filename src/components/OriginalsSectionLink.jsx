import { openWorkspaceSection } from '../utils/originalsWorkspace';

export default function OriginalsSectionLink({ to, children }) {
  return <a href={`#${to}`} onClick={event => { event.preventDefault(); openWorkspaceSection(to); }} className="font-medium underline">{children}</a>;
}
