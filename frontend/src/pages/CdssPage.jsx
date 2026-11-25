import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { relative } from '../lib/format.js';
import { useToast } from '../lib/ToastContext.jsx';

const SEVERITY_ICON = { CRITICAL: 'alert', HIGH: 'alert', MEDIUM: 'bell', LOW: 'bell' };

export default function CdssPage() {
  const { is } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('alerts');
  const [severity, setSeverity] = useState('');
  const [review, setReview] = useState('PENDING');
  const alerts = useApi(tab === 'alerts' ? `/cdss/alerts${qs({ severity, pageSize: 50 })}` : null);
  const results = useApi(tab === 'imaging' ? `/cdss/results${qs({ reviewStatus: review, pageSize: 50 })}` : null);
  const scope = useEntrance([tab, alerts.data?.items.length, results.data?.items.length]);

  const decide = async (r, reviewStatus) => {
    try {
      await api.patch(`/cdss/results/${r.id}/review`, { reviewStatus });
      toast.success(reviewStatus === 'ACCEPTED' ? 'Suggestion accepted' : 'Suggestion rejected');
      results.reload();
    } catch (err) {
      toast.error('Could not save the review', err.message);
    }
  };

  return (
    <div ref={scope}>
      <PageHead
        title="Clinical decision support"
        subtitle="Rule-based alerts on lab results and model suggestions on imaging studies, for clinician review."
        actions={
          <div className="segmented">
            <button className={tab === 'alerts' ? 'on' : ''} onClick={() => setTab('alerts')}>
              Lab alerts
            </button>
            <button className={tab === 'imaging' ? 'on' : ''} onClick={() => setTab('imaging')}>
              Imaging suggestions
            </button>
          </div>
        }
      />

      {tab === 'alerts' && (
        <div className="card" data-animate>
          <div className="card-head">
            <div className="hint">Critical values, abnormal panels and duplicate orders</div>
            <div className="segmented">
              {['', 'CRITICAL', 'MEDIUM', 'LOW'].map((s) => (
                <button key={s || 'all'} className={severity === s ? 'on' : ''} onClick={() => setSeverity(s)}>
                  {s ? s[0] + s.slice(1).toLowerCase() : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <LoadState loading={alerts.loading} error={alerts.error} onRetry={alerts.reload}>
              <div className="list">
                {alerts.data?.items.map((a) => (
                  <div key={a.id} className="list-item" data-animate>
                    <span className={`list-icon ${a.severity === 'CRITICAL' ? 'tone-danger' : 'tone-warn'}`}>
                      <Icon name={SEVERITY_ICON[a.severity]} size={16} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="strong small">{a.message}</div>
                      <div className="small muted">
                        <Link to={`/patients/${a.item.order.patient.id}`}>{a.item.order.patient.fullName}</Link> · {a.item.service.name} · order #{a.item.orderId} ·{' '}
                        {relative(a.createdAt)}
                      </div>
                    </div>
                    <StatusBadge value={a.severity} />
                  </div>
                ))}
                {alerts.data && !alerts.data.items.length && <div className="empty">No alerts.</div>}
              </div>
            </LoadState>
          </div>
        </div>
      )}

      {tab === 'imaging' && (
        <div className="card" data-animate>
          <div className="card-head">
            <div className="hint">Every suggestion must be accepted or rejected by a clinician</div>
            <div className="segmented">
              {['PENDING', 'ACCEPTED', 'REJECTED', ''].map((s) => (
                <button key={s || 'all'} className={review === s ? 'on' : ''} onClick={() => setReview(s)}>
                  {s ? s[0] + s.slice(1).toLowerCase() : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <LoadState loading={results.loading} error={results.error} onRetry={results.reload}>
              <div className="list">
                {results.data?.items.map((r) => (
                  <div key={r.id} className="list-item" data-animate>
                    <span className="list-icon tone-imaging">
                      <Icon name="brain" size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div className="strong small">
                        {r.prediction} · {Math.round(Number(r.confidence) * 100)}%
                      </div>
                      <div className="small muted">
                        <Link to={`/patients/${r.study.item.order.patient.id}`}>{r.study.item.order.patient.fullName}</Link> · {r.study.item.service.name} ·{' '}
                        <span className="mono">{r.modelName}</span> · {relative(r.createdAt)}
                      </div>
                      <div className="confidence" style={{ maxWidth: 240, marginTop: 6 }}>
                        <span style={{ width: `${Number(r.confidence) * 100}%` }} />
                      </div>
                    </div>
                    <StatusBadge value={r.reviewStatus} />
                    <Link className="btn btn-ghost btn-sm" to={`/imaging/${r.studyId}`}>
                      Open study
                    </Link>
                    {is('DOCTOR', 'RADIOLOGIST') && r.reviewStatus === 'PENDING' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => decide(r, 'ACCEPTED')}>
                          Accept
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => decide(r, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {results.data && !results.data.items.length && <div className="empty">Nothing here.</div>}
              </div>
            </LoadState>
          </div>
        </div>
      )}
    </div>
  );
}
