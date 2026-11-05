import { royaltyColor } from '../utils/originalsRoyalties';

const percent = value => `${Number(Number(value).toFixed(2))}%`;

export default function OriginalsRoyaltySplit({ title, shares = [], roles = [], columns = 1 }) {
  return <section className="mt-4">{title && <h3 className="font-semibold">{title}</h3>}{shares.length ? <>
    <div className="mt-3 flex h-8 overflow-hidden rounded" role="img" aria-label={shares.map(share => `${share.role}: ${percent(share.percent)}`).join(', ')}>{shares.map((share, index) => <div key={index} title={`${share.role}: ${percent(share.percent)}`} style={{ width: `${share.percent}%`, backgroundColor: royaltyColor(share.role, roles) }} />)}</div>
    <ul className={columns === 2 ? 'mt-3 grid gap-2 text-sm sm:grid-cols-2' : 'mt-3 space-y-2 text-sm'}>{shares.map((share, index) => <li key={index} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: royaltyColor(share.role, roles) }} /><span className="break-words">{share.role}</span></span><b className="shrink-0">{percent(share.percent)}</b></li>)}</ul>
  </> : <p className="mt-2 text-sm text-gray-600">Shares will be shown once contributions are approved and credit choices are known.</p>}</section>;
}
