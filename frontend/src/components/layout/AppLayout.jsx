import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { applyTheme, initialTheme } from '../../lib/theme.js';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(initialTheme);
  const [navOpen, setNavOpen] = useState(false);
  const [counts, setCounts] = useState({});
  const pageRef = useRef(null);

  useEffect(() => applyTheme(theme), [theme]);

  // Open-worklist counters for the sidebar badges.
  const refreshCounts = useCallback(async () => {
    if (!['ADMIN', 'LAB_TECH', 'RADIOLOGIST', 'DOCTOR'].includes(user.role)) return;
    try {
      const [lab, imaging] = await Promise.all([api.get('/orders/worklist?type=LAB'), api.get('/orders/worklist?type=RADIOLOGY')]);
      setCounts({ lab: lab.length, imaging: imaging.length });
    } catch {
      /* counters are optional */
    }
  }, [user.role]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, location.pathname]);

  // Every route change slides the new page in.
  useGSAP(
    () => {
      if (prefersReducedMotion() || !pageRef.current) return;
      gsap.fromTo(pageRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' });
    },
    { dependencies: [location.pathname] },
  );

  return (
    <div className={`shell${navOpen ? ' nav-open' : ''}`}>
      <Sidebar role={user.role} counts={counts} onNavigate={() => setNavOpen(false)} />
      <div className="main" onClick={() => navOpen && setNavOpen(false)}>
        <Topbar
          user={user}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
          onMenu={(e) => {
            e.stopPropagation();
            setNavOpen(true);
          }}
        />
        <main className="page" ref={pageRef}>
          <Outlet context={{ refreshCounts }} />
        </main>
      </div>
    </div>
  );
}
