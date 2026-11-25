import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import BrandMark from '../components/layout/BrandMark.jsx';
import Field from '../components/ui/Field.jsx';
import Icon from '../components/ui/Icon.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { useToast } from '../lib/ToastContext.jsx';
import { api } from '../lib/api.js';
import { ROLE_LABEL, initials } from '../lib/format.js';
import { check, loginSchema } from '../lib/schemas.js';
import { prefersReducedMotion } from '../hooks/useMotion.js';

const ROLE_ICON = { ADMIN: 'shield', DOCTOR: 'heart', LAB_TECH: 'flask', RADIOLOGIST: 'scan', RECEPTIONIST: 'calendar', PATIENT: 'user' };
const ECG = 'M0 60 H120 L135 60 L145 40 L155 60 H200 L212 60 L222 8 L236 108 L248 60 H300 L318 60 L330 44 L344 60 H460 L475 60 L485 40 L495 60 H540 L552 60 L562 8 L576 108 L588 60 H640 L658 60 L670 44 L684 60 H800';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [demo, setDemo] = useState([]);
  const [registering, setRegistering] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/auth/demo-accounts').then(setDemo).catch(() => setDemo([]));
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-brand', { y: -12, autoAlpha: 0, duration: 0.5 })
        .from('.hero-word', { y: 40, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.2')
        .from('.login-hero p', { y: 16, autoAlpha: 0, duration: 0.5 }, '-=0.4')
        .from('.login-card > *', { x: 24, autoAlpha: 0, duration: 0.5, stagger: 0.07 }, 0.2);

      const path = ref.current.querySelector('.ecg-path');
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, { strokeDashoffset: 0, duration: 2.6, ease: 'none', repeat: -1, repeatDelay: 0.4 });
    },
    { scope: ref },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion() || !demo.length) return;
      gsap.from('.demo-btn', { y: 10, autoAlpha: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
    },
    { scope: ref, dependencies: [demo.length] },
  );

  const submit = async (e) => {
    e.preventDefault();
    const { data, errors: errs } = check(loginSchema, form);
    setErrors(errs);
    if (!data) return;
    setBusy('form');
    try {
      const user = await login(data.username, data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0] === 'Dr.' ? user.name : user.name.split(' ')[0]}`);
    } catch (err) {
      setErrors({ password: err.message });
    } finally {
      setBusy(null);
    }
  };

  const quick = async (username) => {
    setBusy(username);
    try {
      const user = await demoLogin(username);
      toast.success(`Signed in as ${ROLE_LABEL[user.role].toLowerCase()}`, user.name);
    } catch (err) {
      toast.error('Could not sign in', err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="login" ref={ref}>
      <section className="login-hero">
        <div className="row hero-brand">
          <BrandMark size={40} />
          <div>
            <div className="brand-name" style={{ fontSize: 20, color: '#fff' }}>
              MediLink
            </div>
            <div className="brand-sub" style={{ color: '#a9c1d6' }}>
              LABORATORY &amp; IMAGING CENTER
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <h1>
            <span className="hero-word" style={{ display: 'inline-block' }}>One&nbsp;</span>
            <span className="hero-word" style={{ display: 'inline-block' }}>platform,&nbsp;</span>
            <br />
            <span className="hero-word" style={{ display: 'inline-block' }}>
              <em>every result</em>
            </span>
            <span className="hero-word" style={{ display: 'inline-block' }}>
              &nbsp;in&nbsp;one&nbsp;place.
            </span>
          </h1>
          <p>
            Book your visit, follow your tests and read your results online. Our laboratory and imaging teams work from one shared record, so your doctor sees
            everything as soon as it is ready.
          </p>
          <svg className="ecg" viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden="true">
            <path className="ecg-path" d={ECG} fill="none" stroke="#8fb3d4" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>

        <div className="small" style={{ color: '#9fb4c8' }}>
          © 2026 MediLink Diagnostic Center · Laboratory and imaging services
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card stack" style={{ gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Sign in</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Use your MediLink account, or pick a role below.
            </p>
          </div>

          <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
            <Field label="Username" error={errors.username}>
              <input className="input" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input className="input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <button className="btn btn-primary" type="submit" disabled={busy === 'form'}>
              {busy === 'form' ? <span className="spinner" /> : <Icon name="arrowRight" size={16} />}
              Sign in
            </button>
          </form>

          {demo.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row small muted" style={{ gap: 8 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                Quick sign-in
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
              <div className="demo-grid">
                {demo.map((a) => (
                  <button key={a.username} className="demo-btn" onClick={() => quick(a.username)} disabled={Boolean(busy)}>
                    <span className="avatar" style={{ width: 30, height: 30 }}>
                      {busy === a.username ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Icon name={ROLE_ICON[a.role]} size={15} />}
                    </span>
                    <span>
                      <b>{ROLE_LABEL[a.role]}</b>
                      <span>
                        {initials(a.name)} · {a.name.replace(/^Dr\. /, 'Dr. ')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="small muted" style={{ textAlign: 'center', margin: 0 }}>
            New patient?{' '}
            <button type="button" className="btn-link" onClick={() => setRegistering(true)} style={{ border: 0, background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Create a portal account
            </button>
          </p>
        </div>
      </section>

      {registering && <RegisterModal onClose={() => setRegistering(false)} />}
    </div>
  );
}
