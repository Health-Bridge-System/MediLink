import { useState } from 'react';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import LabResultGrid from './LabResultGrid.jsx';
import { api } from '../lib/api.js';
import { useToast } from '../lib/ToastContext.jsx';

// Lab techs type values only; unit, reference range and the High/Low/Critical
// flag are filled in by the API from its reference table.
export default function EnterResultsModal({ item, analytes, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(Object.fromEntries(analytes.map((a) => [a.testName, ''])));
  const [errors, setErrors] = useState({});
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const errs = {};
    for (const a of analytes) {
      const v = values[a.testName].trim();
      if (!v) errs[a.testName] = 'Required';
      else if (!Number.isFinite(Number(v))) errs[a.testName] = 'Enter a number';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const res = await api.post(`/results/items/${item.id}`, {
        values: analytes.map((a) => ({ testName: a.testName, value: Number(values[a.testName]) })),
      });
      setOutcome(res);
      res.alerts.forEach((a) => (a.severity === 'CRITICAL' ? toast.error('Critical value', a.message) : toast.warn('CDSS alert', a.message)));
      toast.success('Results saved', `HL7 ORU^R01 sent · order is now ${res.orderStatus.toLowerCase().replace('_', ' ')}`);
      onSaved();
    } catch (err) {
      toast.error('Could not save results', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`${item.service.name} · ${item.order.patient.fullName}`}
      onClose={onClose}
      footer={
        outcome ? (
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy && <span className="spinner" />}
              Save &amp; release
            </button>
          </>
        )
      }
    >
      {outcome ? (
        <div className="stack">
          <LabResultGrid results={outcome.results} />
          {outcome.alerts.map((a) => (
            <div key={a.message} className={`callout ${a.severity === 'CRITICAL' ? 'danger' : 'warn'}`}>
              <StatusBadge value={a.severity} /> {a.message}
            </div>
          ))}
          {!outcome.alerts.length && <div className="callout">All values within reference ranges. No alerts.</div>}
        </div>
      ) : (
        <div className="form-grid">
          {analytes.map((a) => (
            <Field key={a.testName} label={`${a.testName} (${a.unit})`} error={errors[a.testName]} hint={`Reference ${a.normalRange}`}>
              <input
                className="input mono"
                inputMode="decimal"
                value={values[a.testName]}
                onChange={(e) => setValues({ ...values, [a.testName]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      )}
    </Modal>
  );
}
