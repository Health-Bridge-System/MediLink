import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Icon from './Icon.jsx';
import { prefersReducedMotion } from '../../hooks/useMotion.js';

export default function Modal({ title, onClose, children, footer, width }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.modal-backdrop', { autoAlpha: 0, duration: 0.2 });
      gsap.from('.modal', { y: 24, scale: 0.97, autoAlpha: 0, duration: 0.35, ease: 'power3.out' });
    },
    { scope: ref },
  );

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div ref={ref}>
      <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { width } : undefined}>
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
