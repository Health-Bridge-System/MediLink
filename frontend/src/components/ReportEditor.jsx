import { useEffect, useState } from 'react';
import Field from './ui/Field.jsx';
import Icon from './ui/Icon.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import { dateTime } from '../lib/format.js';
import { check, reportSchema } from '../lib/schemas.js';

// Radiologists edit drafts and sign the final report; everyone else reads it.
export default function ReportEditor({ report, editable, onSave, busy }) {
  const [values, setValues] = useState({ findings: report?.findings ?? '', impression: report?.impression ?? '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({ findings: report?.findings ?? '', impression: report?.impression ?? '' });
  }, [report?.id, report?.status]);

  const save = (status) => {
    if (status === 'FINAL') {
      const { errors: errs } = check(reportSchema, values);
      setErrors(errs);
      if (Object.keys(errs).length) return;
    }
    onSave({ ...values, status });
  };

  const locked = !editable || report?.status === 'FINAL';

  return (
    <div className="card" data-animate>
      <div className="card-head">
        <div className="row" style={{ gap: 8 }}>
          <span className="list-icon tone-primary" style={{ width: 30, height: 30 }}>
            <Icon name="file" size={16} />
          </span>
          <h3>Radiology report</h3>
        </div>
        {report && <StatusBadge value={report.status} />}
      </div>
      <div className="card-body">
        {locked ? (
          report ? (
            <div className="stack" style={{ gap: 10 }}>
              <div>
                <div className="small muted strong">Findings</div>
                <div>{report.findings}</div>
              </div>
              <div>
                <div className="small muted strong">Impression</div>
                <div className="strong">{report.impression}</div>
              </div>
              <div className="small muted">
                {report.radiologist?.fullName}
                {report.signedAt && ` · signed ${dateTime(report.signedAt)}`}
              </div>
            </div>
          ) : (
            <div className="small muted">The radiologist has not written the report yet.</div>
          )
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            <Field label="Findings" error={errors.findings}>
              <textarea className="textarea" value={values.findings} onChange={(e) => setValues({ ...values, findings: e.target.value })} placeholder="Describe what you see…" />
            </Field>
            <Field label="Impression" error={errors.impression}>
              <textarea className="textarea" style={{ minHeight: 70 }} value={values.impression} onChange={(e) => setValues({ ...values, impression: e.target.value })} placeholder="Conclusion for the referring doctor" />
            </Field>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => save('DRAFT')} disabled={busy}>
                Save draft
              </button>
              <button className="btn btn-primary" onClick={() => save('FINAL')} disabled={busy}>
                {busy && <span className="spinner" />}
                Sign &amp; release
              </button>
            </div>
            <div className="small muted">Signing locks the report, shows it to the patient and sends HL7 ORU^R01 to the EMR.</div>
          </div>
        )}
      </div>
    </div>
  );
}
