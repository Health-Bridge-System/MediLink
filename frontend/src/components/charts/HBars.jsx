import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

// rows: [{ label, sub?, value, color }]
export default function HBars({ rows }) {
  const ref = useRef(null);
  const max = Math.max(1, ...rows.map((r) => r.value));

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.hbar-fill', { scaleX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 });
    },
    { scope: ref, dependencies: [rows.length] },
  );

  return (
    <div ref={ref} className="stack" style={{ gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <div className="small">
            <span className="strong">{r.label}</span>
            {r.sub && <span className="muted"> · {r.sub}</span>}
          </div>
          <b className="small">{r.value}</b>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
