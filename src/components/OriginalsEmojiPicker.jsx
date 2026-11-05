import { useEffect, useId, useRef, useState } from 'react';

const EMOJIS = [
  ['😀', 'Grinning face'], ['😊', 'Smiling face'], ['😂', 'Laughing with tears'], ['🥰', 'Smiling with hearts'],
  ['😍', 'Heart eyes'], ['😎', 'Cool face'], ['🤔', 'Thinking'], ['😅', 'Smiling with sweat'],
  ['😢', 'Crying'], ['🙏', 'Thank you'], ['👍', 'Thumbs up'], ['👎', 'Thumbs down'],
  ['👏', 'Applause'], ['🙌', 'Celebration hands'], ['👋', 'Wave'], ['💪', 'Strong arm'],
  ['❤️', 'Red heart'], ['💜', 'Purple heart'], ['🔥', 'Fire'], ['✨', 'Sparkles'],
  ['🎉', 'Party'], ['✅', 'Check mark'], ['💯', 'One hundred'], ['💡', 'Idea'],
  ['🎵', 'Music note'], ['🎶', 'Music notes'], ['🎤', 'Microphone'], ['🎧', 'Headphones'],
  ['🎸', 'Guitar'], ['🎹', 'Keyboard'], ['🥁', 'Drum'], ['🎷', 'Saxophone'],
  ['🎺', 'Trumpet'], ['🎻', 'Violin'], ['🪕', 'Banjo'], ['🪘', 'Hand drum'],
  ['🎼', 'Musical score'], ['🎙️', 'Studio microphone'], ['🔊', 'Speaker'], ['🚀', 'Rocket'],
];

export default function OriginalsEmojiPicker({ onSelect, disabled = false, children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const toggle = useRef(null);
  const panel = useRef(null);
  const id = useId();
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('button[data-emoji]')?.focus();
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  const close = () => { setOpen(false); toggle.current?.focus(); };
  return <div ref={root} className="min-w-0" onKeyDown={event => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    {open && !disabled && <div ref={panel} id={id} role="region" aria-label="Choose an emoji" className="mb-3 rounded-lg border bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Choose an emoji</p><button type="button" onClick={close} className="text-sm underline">Close</button></div>
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-10">{EMOJIS.map(([emoji, name]) => <button key={name} type="button" data-emoji={emoji} aria-label={name} title={name} onClick={() => { onSelect(emoji); setOpen(false); }} className="min-h-11 rounded text-2xl hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-700">{emoji}</button>)}</div>
    </div>}
    <div className="flex flex-wrap items-center gap-2"><button ref={toggle} type="button" aria-label="Add emoji" aria-expanded={open && !disabled} aria-controls={open && !disabled ? id : undefined} disabled={disabled} onClick={() => setOpen(value => !value)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">😊 Emoji</button>{children}</div>
  </div>;
}
