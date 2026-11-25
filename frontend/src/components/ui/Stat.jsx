import Icon from './Icon.jsx';
import { useCountUp } from '../../hooks/useMotion.js';

const TONE_VARS = {
  primary: ['var(--primary)', 'var(--primary-soft)'],
  lab: ['var(--lab)', 'var(--lab-soft)'],
  imaging: ['var(--imaging)', 'var(--imaging-soft)'],
  warn: ['var(--warn)', 'var(--warn-soft)'],
  danger: ['var(--danger)', 'var(--danger-soft)'],
  info: ['var(--info)', 'var(--info-soft)'],
};

export default function Stat({ label, value, format, icon, tone = 'primary', foot }) {
  const ref = useCountUp(value, format);
  const [c, soft] = TONE_VARS[tone];
  return (
    <div className="card stat" data-animate style={{ '--tone': c, '--tone-soft': soft }}>
      <div className="stat-label">
        <span className="stat-icon">
          <Icon name={icon} size={16} />
        </span>
        {label}
      </div>
      <div className="stat-value" ref={ref}>
        {value === null || value === undefined ? '—' : '0'}
      </div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}
