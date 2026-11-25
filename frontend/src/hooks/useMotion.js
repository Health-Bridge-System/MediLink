import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Staggered entrance for every element marked [data-animate] inside the
// returned ref. Re-runs whenever a dependency changes (e.g. data arrives).
export function useEntrance(deps = [], { y = 14, stagger = 0.05, delay = 0 } = {}) {
  const scope = useRef(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const targets = gsap.utils.toArray('[data-animate]:not([data-animated])', scope.current);
      if (!targets.length) return;
      targets.forEach((t) => t.setAttribute('data-animated', ''));
      gsap.from(targets, { y, autoAlpha: 0, duration: 0.5, ease: 'power3.out', stagger, delay, clearProps: 'transform,opacity,visibility' });
    },
    { scope, dependencies: deps },
  );
  return scope;
}

// Animates a number from 0 to `value` into the element's text.
export function useCountUp(value, format = (v) => Math.round(v).toLocaleString()) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (!ref.current || value === null || value === undefined) return;
      if (prefersReducedMotion()) {
        ref.current.textContent = format(value);
        return;
      }
      const counter = { v: 0 };
      gsap.to(counter, {
        v: Number(value),
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(counter.v);
        },
      });
    },
    { dependencies: [value] },
  );
  return ref;
}
