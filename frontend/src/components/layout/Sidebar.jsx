import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Icon from '../ui/Icon.jsx';
import BrandMark from './BrandMark.jsx';
import { navFor } from './navigation.js';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

export default function Sidebar({ role, counts, onNavigate }) {
  const ref = useRef(null);
  const items = navFor(role);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.nav-link, .nav-section', { x: -16, autoAlpha: 0, duration: 0.4, stagger: 0.025, ease: 'power2.out' });
    },
    { scope: ref, dependencies: [role] },
  );

  return (
    <aside className="sidebar" ref={ref}>
      <div className="brand">
        <BrandMark />
        <div>
          <div className="brand-name">MediLink</div>
          <div className="brand-sub">DIAGNOSTIC CENTER</div>
        </div>
      </div>

      {items.map((item, i) =>
        item.section ? (
          <div key={`s-${i}`} className="nav-section">
            {item.section}
          </div>
        ) : (
          <NavLink key={item.to + item.label} to={item.to} end={item.to === '/'} className="nav-link" onClick={onNavigate}>
            <Icon name={item.icon} />
            {item.label}
            {item.badge && counts?.[item.badge] > 0 && <span className="nav-count">{counts[item.badge]}</span>}
          </NavLink>
        ),
      )}

    </aside>
  );
}
