import { remainingMasterRoyaltyPool } from '../utils/originalsRoyalties';
import OriginalsRoyaltySplit from './OriginalsRoyaltySplit';

export default function OriginalsMasterRoyaltySplit({ shares, roles = [], title = 'Recording (master) royalty pool', columns = 1 }) {
  const pool = remainingMasterRoyaltyPool(shares);
  return <section className="mt-4" aria-label={title}>
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">TSC receives {pool.tscPercent}% of master royalty receipts for project management, marketing, promotion, distribution and administration. The remaining {pool.remainingPercent}% is shared below as a <b>100% participant pool</b>.</p>
    <p className="mt-2 text-xs text-gray-600">Those services are covered by TSC’s share, with no additional project costs deducted from participants’ shares. Songwriting royalties are separate.</p>
    <OriginalsRoyaltySplit shares={pool.shares} roles={roles} columns={columns} />
    <p className="mt-2 text-xs text-gray-500">All percentages above refer to the remaining pool. Figures are rounded for display.</p>
  </section>;
}
