import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../../hooks/useMotion.js';
import { money } from '../../lib/format.js';

// Monthly collected payments as an area chart that draws itself left to right.
export default function RevenueArea({ data, height = 180 }) {
  const ref = useRef(null);
  const W = 420;
  const H = height;
  const pad = { l: 8, r: 8, t: 22, b: 24 };
  const max = Math.max(1, ...data.map((d) => d.total)) * 1.15;
  const n = Math.max(data.length, 2);
  const x = (i) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  const points = data.length === 1 ? [{ ...data[0], i: 0 }, { ...data[0], i: 1 }] : data.map((d, i) => ({ ...d, i }));
  const line = points.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.total)}`).join(' ');
  const area = `${line} L${x(points.at(-1).i)},${H - pad.b} L${x(0)},${H - pad.b} Z`;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo('.reveal', { attr: { width: 0 } }, { attr: { width: W }, duration: 1.2, ease: 'power2.inOut' });
      gsap.from('.dot', { scale: 0, transformOrigin: 'center', duration: 0.4, stagger: 0.12, delay: 0.5, ease: 'back.out(2)' });
    },
    { scope: ref, dependencies: [data.length] },
  );

  return (
    <div ref={ref}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Revenue by month">
        <defs>
          <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="rev-clip">
            <rect className="reveal" x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        <g clipPath="url(#rev-clip)">
          <path d={area} fill="url(#rev-fill)" />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        {data.map((d, i) => (
          <g key={d.month}>
            <circle className="dot" cx={x(i)} cy={y(d.total)} r="4.5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" />
            <text x={x(i)} y={y(d.total) - 10} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} style={{ fontWeight: 700, fill: 'var(--ink-2)' }}>
              {money(d.total)}
            </text>
            <text x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
              {new Date(`${d.month}-01`).toLocaleDateString('en-GB', { month: 'short' })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
