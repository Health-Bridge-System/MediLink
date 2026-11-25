import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Icon from './ui/Icon.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import { prefersReducedMotion } from '../hooks/useMotion.js';
import { relative } from '../lib/format.js';

// The model's suggestion for one study. A clinician must accept or reject it.
export default function CdssResultCard({ result, canReview, canRerun, onReview, onRerun, busy }) {
  const ref = useRef(null);
  const scores = Object.entries(result?.details?.scores ?? {}).sort((a, b) => b[1] - a[1]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.confidence span', { scaleX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 });
    },
    { scope: ref, dependencies: [result?.id] },
  );

  return (
    <div className="card" ref={ref} data-animate>
      <div className="card-head">
        <div className="row" style={{ gap: 8 }}>
          <span className="list-icon tone-imaging" style={{ width: 30, height: 30 }}>
            <Icon name="brain" size={16} />
          </span>
          <h3>Decision support</h3>
        </div>
        {result && <StatusBadge value={result.reviewStatus} />}
      </div>
      <div className="card-body">
        {!result ? (
          <div className="small muted">No analysis yet.</div>
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <div className="small muted">Suggested finding</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--imaging)' }}>{result.prediction}</div>
              <div className="small muted mono">
                {result.modelName} · {relative(result.createdAt)}
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {scores.map(([label, p]) => (
                <div key={label}>
                  <div className="spread small">
                    <span>{label}</span>
                    <b>{Math.round(p * 100)}%</b>
                  </div>
                  <div className="confidence">
                    <span style={{ width: `${p * 100}%`, opacity: label === result.prediction ? 1 : 0.45 }} />
                  </div>
                </div>
              ))}
            </div>
            {result.reviewer && (
              <div className="small muted">
                Reviewed by <b>{result.reviewer.fullName}</b>
              </div>
            )}
            {canReview && result.reviewStatus === 'PENDING' && (
              <div className="row">
                <button className="btn btn-primary btn-sm" onClick={() => onReview('ACCEPTED')} disabled={busy}>
                  <Icon name="check" size={14} /> Accept
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onReview('REJECTED')} disabled={busy}>
                  <Icon name="x" size={14} /> Reject
                </button>
              </div>
            )}
            <div className="callout small">
              <Icon name="alert" size={15} />
              Suggestions support the radiologist; they never replace the report.
            </div>
          </div>
        )}
        {canRerun && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={onRerun} disabled={busy}>
            <Icon name="refresh" size={14} /> Run analysis again
          </button>
        )}
      </div>
    </div>
  );
}
