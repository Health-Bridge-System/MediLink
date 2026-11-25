import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Icon from './Icon.jsx';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

const ICONS = { success: 'check', error: 'alert', warn: 'bell' };

export default function Toasts({ toasts, onDismiss }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const fresh = gsap.utils.toArray('.toast:not([data-shown])', ref.current);
      fresh.forEach((t) => t.setAttribute('data-shown', ''));
      gsap.from(fresh, { x: 40, autoAlpha: 0, duration: 0.35, ease: 'back.out(1.6)' });
    },
    { scope: ref, dependencies: [toasts.length] },
  );

  return (
    <div className="toasts" ref={ref} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role="status">
          <Icon name={ICONS[t.kind]} size={18} />
          <div style={{ flex: 1 }}>
            <div className="strong">{t.title}</div>
            {t.text && <div className="small muted">{t.text}</div>}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
