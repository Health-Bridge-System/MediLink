import { Link } from 'react-router-dom';
import Badge from './ui/Badge.jsx';
import Icon from './ui/Icon.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import LabResultGrid from './LabResultGrid.jsx';
import { dateTime } from '../lib/format.js';

// One order on the patient timeline, with every item following its own path.
export default function OrderTimelineItem({ order, showClinical }) {
  const hasImaging = order.items.some((i) => i.service.type === 'RADIOLOGY');
  return (
    <div className="tl-item" data-animate style={{ '--tl': hasImaging ? 'var(--imaging)' : 'var(--lab)' }}>
      <div className="card card-pad">
        <div className="spread" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <b>Order #{order.id}</b>
              <StatusBadge value={order.priority} dot={false} />
              <StatusBadge value={order.status} />
            </div>
            <div className="small muted">
              {dateTime(order.orderDate)} · {order.doctor.fullName}
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 12, marginTop: 12 }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
              <div className="spread">
                <div className="row" style={{ gap: 8 }}>
                  <StatusBadge value={item.service.type} dot={false} />
                  <span className="strong small">{item.service.name}</span>
                </div>
                <StatusBadge value={item.status} />
              </div>

              {item.labResults?.length > 0 && <LabResultGrid results={item.labResults} />}

              {showClinical &&
                item.cdssAlerts?.map((a) => (
                  <div key={a.id} className={`callout ${a.severity === 'CRITICAL' ? 'danger' : 'warn'}`} style={{ marginTop: 8 }}>
                    <Icon name="alert" size={16} />
                    <span>{a.message}</span>
                  </div>
                ))}

              {item.imagingStudy && (
                <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                  <div className="row small muted" style={{ gap: 6 }}>
                    <Icon name="layers" size={14} />
                    {item.imagingStudy.series.length} series · {item.imagingStudy.series.reduce((s, x) => s + (x.numInstances ?? 0), 0)} images
                    <Link to={`/imaging/${item.imagingStudy.id}`} className="strong" style={{ marginLeft: 6 }}>
                      Open viewer →
                    </Link>
                  </div>
                  {item.imagingStudy.report ? (
                    <div className="callout" style={{ background: 'var(--imaging-soft)' }}>
                      <Icon name="file" size={16} />
                      <div>
                        <div className="row" style={{ gap: 6 }}>
                          <b>Impression</b> <StatusBadge value={item.imagingStudy.report.status} />
                        </div>
                        <div>{item.imagingStudy.report.impression}</div>
                        <div className="small muted">{item.imagingStudy.report.findings}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="small muted">Report not released yet.</div>
                  )}
                  {showClinical &&
                    item.imagingStudy.cdssResults?.map((c) => (
                      <div key={c.id} className="row small" style={{ gap: 8 }}>
                        <Badge tone="imaging">
                          <Icon name="brain" size={12} /> AI
                        </Badge>
                        {c.prediction} · {Math.round(Number(c.confidence) * 100)}% <StatusBadge value={c.reviewStatus} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
