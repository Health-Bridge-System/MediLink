import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { age, relative } from '../lib/format.js';
import { useToast } from '../lib/ToastContext.jsx';

// Default acquisition protocol per modality (what the scanner would send to Orthanc).
const PROTOCOL = {
  CR: [{ bodyPart: 'CHEST', description: 'PA view', numInstances: 1 }, { bodyPart: 'CHEST', description: 'Lateral view', numInstances: 1 }],
  DX: [{ bodyPart: 'KNEE', description: 'AP standing', numInstances: 1 }, { bodyPart: 'KNEE', description: 'Lateral', numInstances: 1 }],
  CT: [{ bodyPart: 'CHEST', description: 'Axial 1.25 mm', numInstances: 64 }, { bodyPart: 'CHEST', description: 'Axial 2.5 mm', numInstances: 32 }],
  MR: [{ bodyPart: 'HEAD', description: 'Axial T2', numInstances: 24 }, { bodyPart: 'HEAD', description: 'Axial FLAIR', numInstances: 24 }],
  US: [{ bodyPart: 'ABDOMEN', description: 'Abdomen survey', numInstances: 12 }],
};

export default function ImagingWorklistPage() {
  const { is } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { refreshCounts } = useOutletContext();
  const [status, setStatus] = useState('OPEN');
  const { data, error, loading, reload } = useApi(`/orders/worklist?type=RADIOLOGY&status=${status}`);
  const [busy, setBusy] = useState(null);
  const scope = useEntrance([data?.length, status]);

  const acquire = async (item) => {
    setBusy(item.id);
    try {
      const study = await api.post('/imaging/studies', { itemId: item.id, series: PROTOCOL[item.service.modality] ?? PROTOCOL.CR });
      const ai = study.cdssResults[0];
      toast.success('Study stored', `${study.series.length} series registered${ai ? ` · AI suggests “${ai.prediction}”` : ''}`);
      refreshCounts();
      navigate(`/imaging/${study.id}`);
    } catch (err) {
      toast.error('Could not register the study', err.message);
      setBusy(null);
    }
  };

  return (
    <div ref={scope}>
      <PageHead
        title="Imaging worklist"
        subtitle="Acquire the study, review the AI suggestion, then write and sign the report."
        actions={
          <div className="segmented">
            {[
              ['OPEN', 'Open'],
              ['COMPLETED', 'Reported'],
            ].map(([v, l]) => (
              <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                {l}
              </button>
            ))}
          </div>
        }
      />

      <div className="card" data-animate>
        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Patient</th>
                  <th>Priority</th>
                  <th>AI (CDSS)</th>
                  <th>Report</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.map((item) => {
                  const study = item.imagingStudy;
                  const ai = study?.cdssResults?.[0];
                  return (
                    <tr key={item.id} data-animate>
                      <td>
                        <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                          <span className="list-icon tone-imaging">
                            <Icon name="scan" size={16} />
                          </span>
                          <div>
                            <div className="cell-title">{item.service.name}</div>
                            <div className="cell-sub">
                              {item.service.modality} · order #{item.orderId} · {relative(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link to={`/patients/${item.order.patient.id}`} className="cell-title">
                          {item.order.patient.fullName}
                        </Link>
                        <div className="cell-sub">
                          {age(item.order.patient.birthDate)} y · {item.order.doctor.fullName}
                        </div>
                      </td>
                      <td>
                        <StatusBadge value={item.order.priority} dot={false} />
                      </td>
                      <td>
                        {ai ? (
                          <div>
                            <div className="small strong">
                              {ai.prediction} · {Math.round(Number(ai.confidence) * 100)}%
                            </div>
                            <StatusBadge value={ai.reviewStatus} />
                          </div>
                        ) : (
                          <span className="small muted">{study ? 'Analysing…' : 'After acquisition'}</span>
                        )}
                      </td>
                      <td>{study?.report ? <StatusBadge value={study.report.status} /> : <span className="small muted">{study ? 'Not started' : '—'}</span>}</td>
                      <td style={{ textAlign: 'right' }}>
                        {study ? (
                          <Link className="btn btn-primary btn-sm" to={`/imaging/${study.id}`}>
                            Open study
                          </Link>
                        ) : (
                          is('RADIOLOGIST') && (
                            <button className="btn btn-primary btn-sm" onClick={() => acquire(item)} disabled={busy === item.id}>
                              {busy === item.id && <span className="spinner" />}
                              Acquire &amp; store
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data && !data.length && <div className="empty">No imaging exams waiting.</div>}
          </div>
        </LoadState>
      </div>
    </div>
  );
}
