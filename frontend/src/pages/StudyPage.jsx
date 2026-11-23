import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CdssResultCard from '../components/CdssResultCard.jsx';
import DicomViewer from '@imaging/viewer/DicomViewer.jsx';
import ReportEditor from '../components/ReportEditor.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { dateTime } from '../lib/format.js';
import { useToast } from '../lib/ToastContext.jsx';

export default function StudyPage() {
  const { id } = useParams();
  const { is } = useAuth();
  const toast = useToast();
  const { data: study, error, loading, reload } = useApi(`/imaging/studies/${id}`);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const scope = useEntrance([Boolean(study)]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      if (success) toast.success(success);
      await reload();
    } catch (err) {
      toast.error('Something went wrong', err.message);
    } finally {
      setBusy(false);
    }
  };

  const series = study?.series[seriesIdx] ?? study?.series[0];
  const patient = study?.item.order.patient;
  const clinician = is('DOCTOR', 'RADIOLOGIST');

  return (
    <div ref={scope}>
      <LoadState loading={loading} error={error} onRetry={reload} rows={3}>
        {study && (
          <div className="stack">
            <div className="spread" data-animate style={{ flexWrap: 'wrap' }}>
              <div>
                <Link to={is('PATIENT') ? '/me' : `/patients/${patient.id}`} className="small strong">
                  ← {patient.fullName}
                </Link>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{study.item.service.name}</h1>
                <div className="small muted">
                  Study #{study.id} · {dateTime(study.performedAt)} · ordered by {study.item.order.doctor.fullName} ·{' '}
                  <span className="mono" title={study.dicomStudyUid}>
                    UID {study.dicomStudyUid.slice(0, 22)}…
                  </span>
                </div>
              </div>
              <div className="row">
                <StatusBadge value={study.item.order.priority} dot={false} />
                <StatusBadge value={study.item.status} />
              </div>
            </div>

            <div className="segmented" data-animate style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
              {study.series.map((s, i) => (
                <button key={s.id} className={series.id === s.id ? 'on' : ''} onClick={() => setSeriesIdx(i)}>
                  <Icon name="layers" size={13} /> {s.description} <span className="muted">({s.numInstances})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-main" style={{ alignItems: 'start' }}>
              <div className="stack" data-animate>
                <DicomViewer
                  study={study}
                  series={series}
                  patient={patient}
                  canMeasure={clinician}
                  onMeasure={(points, mm) =>
                    run(
                      () => api.post(`/imaging/series/${series.id}/annotations`, { type: 'LENGTH', geometry: { points, value: mm, unit: 'mm' }, note: 'Length measurement' }),
                      `Measurement saved · ${mm} mm`,
                    )
                  }
                />
                {series.annotations?.length > 0 && (
                  <div className="card">
                    <div className="card-head">
                      <h3>Annotations on this series</h3>
                      <span className="hint">{series.annotations.length} saved</span>
                    </div>
                    <div className="card-body">
                      <div className="list">
                        {series.annotations.map((a) => (
                          <div key={a.id} className="list-item">
                            <span className="list-icon tone-warn">
                              <Icon name="ruler" size={15} />
                            </span>
                            <div style={{ flex: 1 }}>
                              <div className="small strong">
                                {a.type === 'ANGLE' ? 'Angle' : 'Length'} · {a.geometry.value} {a.geometry.unit === 'deg' ? '°' : a.geometry.unit}
                              </div>
                              <div className="small muted">
                                {a.staff.fullName} · {dateTime(a.createdAt)}
                                {a.note && ` · ${a.note}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="stack">
                {!is('PATIENT') && (
                  <CdssResultCard
                    result={study.cdssResults[0]}
                    canReview={clinician}
                    canRerun={is('RADIOLOGIST') && study.report?.status !== 'FINAL'}
                    busy={busy}
                    onReview={(reviewStatus) =>
                      run(() => api.patch(`/cdss/results/${study.cdssResults[0].id}/review`, { reviewStatus }), reviewStatus === 'ACCEPTED' ? 'Suggestion accepted' : 'Suggestion rejected')
                    }
                    onRerun={() => run(() => api.post(`/imaging/studies/${study.id}/analyze`), 'Analysis finished')}
                  />
                )}
                <ReportEditor
                  report={study.report}
                  editable={is('RADIOLOGIST')}
                  busy={busy}
                  onSave={(body) => run(() => api.put(`/imaging/studies/${study.id}/report`, body), body.status === 'FINAL' ? 'Report signed and released' : 'Draft saved')}
                />
              </div>
            </div>
          </div>
        )}
      </LoadState>
    </div>
  );
}
