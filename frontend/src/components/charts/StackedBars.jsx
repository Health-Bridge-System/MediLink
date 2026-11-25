import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

// Daily tests split by path (lab / imaging). Bars grow from the baseline.
export default function StackedBars({ data, height = 220 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = height;
  const pad = { l: 28, r: 8, t: 12, b: 26 };
  const max = Math.max(4, ...data.map((d) => d.LAB + d.RADIOLOGY));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / data.length;
  const bw = Math.min(26, slot * 0.62);
  const y = (v) => pad.t + innerH - (v / top) * innerH;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.bar', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'power3.out', stagger: 0.025 });
    },
    { scope: ref, dependencies: [data.length] },
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tests per day">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line className="grid-line" x1={pad.l} x2={W - pad.r} y1={y(i * step)} y2={y(i * step)} />
            <text x={pad.l - 8} y={y(i * step) + 4} textAnchor="end">
              {i * step}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + slot * i + (slot - bw) / 2;
          const labH = y(0) - y(d.LAB);
          const radH = y(0) - y(d.RADIOLOGY);
          const label = new Date(d.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          return (
            <g key={d.day} onMouseEnter={() => setHover({ ...d, i, label })} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={innerH} fill="transparent" />
              <g className="bar">
                <rect x={x} y={y(d.LAB)} width={bw} height={labH} rx={3} fill="var(--lab)" />
                <rect x={x} y={y(d.LAB) - radH} width={bw} height={radH} rx={3} fill="var(--imaging)" />
              </g>
              {(i % 2 === 0 || data.length <= 10) && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle">
                  {label.split(' ')[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          className="card small"
          style={{
            position: 'absolute',
            top: 0,
            left: `${((pad.l + slot * hover.i + slot / 2) / W) * 100}%`,
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow)',
            whiteSpace: 'nowrap',
          }}
        >
          <b>{hover.label}</b> · {hover.LAB} lab · {hover.RADIOLOGY} imaging
        </div>
      )}
    </div>
  );
}
