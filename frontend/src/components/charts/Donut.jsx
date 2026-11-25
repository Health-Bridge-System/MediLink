import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

// segments: [{ label, value, color }]
export default function Donut({ segments, size = 168, thickness = 22, center }) {
  const ref = useRef(null);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const gap = segments.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = segments.map((s) => {
    const len = Math.max(0, (s.value / total) * c - gap);
    const arc = { ...s, len, offset };
    offset += (s.value / total) * c;
    return arc;
  });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray('.arc', ref.current).forEach((el, i) => {
        gsap.fromTo(el, { strokeDasharray: `0 ${c}` }, { strokeDasharray: `${arcs[i].len} ${c}`, duration: 0.9, delay: i * 0.08, ease: 'power2.out' });
      });
    },
    { scope: ref, dependencies: [total] },
  );

  return (
    <div ref={ref} className="row" style={{ gap: 20, flexWrap: 'nowrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution" style={{ flex: 'none' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a) => (
            <circle
              key={a.label}
              className="arc"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={`${a.len} ${c}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        {center && (
          <>
            <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: 'var(--ink)' }}>
              {center.value}
            </text>
            <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--muted)' }}>
              {center.label}
            </text>
          </>
        )}
      </svg>
      <div className="stack" style={{ gap: 8 }}>
        {segments.map((s) => (
          <div key={s.label} className="row small" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block' }} />
            <span style={{ minWidth: 70 }}>{s.label}</span>
            <b>{s.value}</b>
            <span className="muted">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
