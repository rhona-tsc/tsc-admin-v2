import React, { useId, useState } from 'react';

export const emptyEnquiryPreferences = () => ({ styles: [], preferredSize: '', mustHaveInstruments: [], selectedBands: [] });
export const readEnquiryPreferences = row => ({
  styles: row?.styles || [], preferredSize: row?.preferredSize || '',
  mustHaveInstruments: row?.mustHaveInstruments || [], selectedBands: row?.selectedBands || [],
});

function PreferenceTags({ label, values = [], options = [], onChange }) {
  const id = useId();
  const [custom, setCustom] = useState('');
  const add = raw => {
    const next = raw.trim();
    if (next && !values.some(value => value.toLowerCase() === next.toLowerCase())) onChange([...values, next]);
    setCustom('');
  };
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">{label}</label>
    <select id={id} className="w-full rounded border bg-white p-2 text-sm" value="" onChange={event => add(event.target.value)}>
      <option value="">Add {label.toLowerCase()}…</option>
      {options.filter(option => !values.includes(option)).map(option => <option key={option}>{option}</option>)}
    </select>
    <div className="flex gap-2">
      <input aria-label={`Other ${label.toLowerCase()}`} className="min-w-0 flex-1 rounded border p-2 text-sm" placeholder="Or add your own" maxLength={100}
        value={custom} onChange={event => setCustom(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(custom); } }} />
      <button type="button" className="rounded border px-3 text-sm disabled:opacity-40" disabled={!custom.trim()} onClick={() => add(custom)}>Add</button>
    </div>
    <div className="flex flex-wrap gap-2">
      {values.map(value => <span key={value} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
        {value}<button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter(item => item !== value))}>×</button>
      </span>)}
    </div>
  </div>;
}

export default function EnquiryPreferencesFields({ value, onChange, options = {}, showBands = true }) {
  const sizesId = useId();
  const update = patch => onChange({ ...value, ...patch });
  const selected = value.selectedBands || [];
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <PreferenceTags label="Style" values={value.styles} options={options.styles || []} onChange={styles => update({ styles })} />
    <label className="block text-sm font-medium">Preferred size
      <input className="mt-2 w-full rounded border p-2 font-normal" aria-label="Preferred size" list={sizesId} maxLength={80}
        placeholder="e.g. Trio, 5-piece or flexible" value={value.preferredSize} onChange={event => update({ preferredSize: event.target.value })} />
      <datalist id={sizesId}>{['Solo', 'Duo', 'Trio / 3-piece', '4-piece', '5-piece', '6-piece', '7-piece', '8-piece', 'Flexible'].map(size => <option key={size} value={size} />)}</datalist>
      <span className="mt-2 block text-xs font-normal text-gray-500">What the client wants. Keep the final quoted band size separate.</span>
    </label>
    <div className={showBands ? '' : 'sm:col-span-2'}>
      <PreferenceTags label="Must-have instruments" values={value.mustHaveInstruments} options={options.instruments || []} onChange={mustHaveInstruments => update({ mustHaveInstruments })} />
    </div>
    {showBands && <div className="space-y-2">
      <label className="block text-sm font-medium">Selected bands
        <select aria-label="Add selected band" className="mt-2 w-full rounded border bg-white p-2 font-normal" value="" onChange={event => {
          const band = options.bands?.find(item => item.actId === event.target.value);
          if (band) update({ selectedBands: [...selected, { actId: band.actId, name: band.name, lineupId: '' }] });
        }}>
          <option value="">Choose a band…</option>
          {(options.bands || []).filter(band => !selected.some(item => String(item.actId) === band.actId)).map(band => <option key={band.actId} value={band.actId}>{band.name}</option>)}
        </select>
      </label>
      {selected.map((band, index) => {
        const choices = options.bands?.find(item => item.actId === String(band.actId))?.lineups || [];
        return <div key={`${band.actId || band.name}-${index}`} className="rounded border bg-gray-50 p-2 text-sm">
          <div className="flex items-start justify-between gap-2"><span>{band.name}</span><button type="button" aria-label={`Remove ${band.name}`} className="text-gray-500" onClick={() => update({ selectedBands: selected.filter((_, i) => i !== index) })}>×</button></div>
          {choices.length > 0 && <select aria-label={`${band.name} preferred lineup`} className="mt-2 w-full rounded border bg-white p-1 text-xs" value={band.lineupId || ''} onChange={event => update({ selectedBands: selected.map((item, i) => i === index ? { ...item, lineupId: event.target.value } : item) })}>
            <option value="">Lineup not selected</option>{choices.map(lineup => <option key={lineup.lineupId} value={lineup.lineupId}>{lineup.name}</option>)}
          </select>}
        </div>;
      })}
    </div>}
  </div>;
}
