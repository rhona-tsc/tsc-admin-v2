import { originalsRoleImage } from '../utils/originalsRoleImages';
import './OriginalsRoleCard.css';

const positions = { drums: '50% 40%', vocal: '45% 35%', 'female-vocal': '50% 35%', saxophone: '57% 50%' };
const assetBase = `${import.meta.env?.BASE_URL || '/'}originals/role-backgrounds/`;

export default function OriginalsRoleCard({ roleName, children, as: element = 'li', compact = false }) {
  const image = originalsRoleImage(roleName);
  const Element = element;
  return <Element className={`originals-role-card${compact ? ' originals-role-card--compact' : ''}`}>
    <img alt="" aria-hidden="true" loading="lazy" decoding="async" className="originals-role-card__photo" src={`${assetBase}${image}-960.webp`} srcSet={`${assetBase}${image}-480.webp 480w, ${assetBase}${image}-960.webp 960w`} sizes="(min-width: 1280px) 600px, (min-width: 640px) 48vw, 100vw" style={{ objectPosition: positions[image] || '50% 50%' }} />
    <div className="originals-role-card__content">{children}</div>
  </Element>;
}
