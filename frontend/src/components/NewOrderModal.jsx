import { useState } from 'react';
import Field from './ui/Field.jsx';
import Icon from './ui/Icon.jsx';
import Modal from './ui/Modal.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { check, orderSchema } from '../lib/schemas.js';
import { useToast } from '../lib/ToastContext.jsx';

const PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'];

export default function NewOrderModal({ patient, onClose, onCreated }) {
  const toast = useToast();
  const services = useApi('/services');
  const patients = useApi(patient ? null : '/patients?pageSize=100');
  const [values, setValues] = useState({ patientId: patient?.id ?? '', priority: 'ROUTINE', serviceIds: [], icd10Code: '', diagnosisText: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const toggle = (id) =>
    setValues((v) => ({ ...v, serviceIds: v.serviceIds.includes(id) ? v.serviceIds.filter((x) => x !== id) : [...v.serviceIds, id] }));

  const submit = async () => {
    const { data, errors: errs } = check(orderSchema, values);
    setErrors(errs);
    if (!data) return;
    setBusy(true);
    try {
      const order = await api.post('/orders', {
        patientId: data.patientId,
        priority: data.priority,
        serviceIds: data.serviceIds,
        diagnosis: data.icd10Code ? { icd10Code: data.icd10Code, description: data.diagnosisText } : undefined,
      });
      const warnings = order.items.flatMap((i) => i.cdssAlerts);
      toast.success(`Order #${order.id} created`, `${order.items.length} test(s) routed to the worklists · HL7 ORM^O01 sent`);
      warnings.forEach((w) => toast.warn('CDSS warning', w.message));
      onCreated(order);
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      toast.error('Could not create the order', err.message);
      setBusy(false);
    }
  };

  const group = (type) => (services.data ?? []).filter((s) => s.type === type);

  return (
    <Modal
      title={patient ? `New order for ${patient.fullName}` : 'New diagnostic order'}
      onClose={onClose}
      width={720}
      footer={
        <>
          <span className="muted small" style={{ marginRight: 'auto' }}>
            {values.serviceIds.length} test(s) selected
          </span>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />}
            Place order
          </button>
        </>
      }
    >
      <div className="stack">
        {!patient && (
          <Field label="Patient" error={errors.patientId}>
            <select className="select" value={values.patientId} onChange={(e) => setValues({ ...values, patientId: e.target.value })}>
              <option value="">Choose a patient…</option>
              {patients.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} · {p.nationalId}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Priority">
          <div className="segmented">
            {PRIORITIES.map((p) => (
              <button key={p} type="button" className={values.priority === p ? 'on' : ''} onClick={() => setValues({ ...values, priority: p })}>
                {p === 'STAT' ? 'STAT' : p[0] + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </Field>

        {['LAB', 'RADIOLOGY'].map((type) => (
          <div key={type}>
            <div className="row small strong" style={{ gap: 6, marginBottom: 8, color: type === 'LAB' ? 'var(--lab)' : 'var(--imaging)' }}>
              <Icon name={type === 'LAB' ? 'flask' : 'scan'} size={15} />
              {type === 'LAB' ? 'Laboratory' : 'Imaging'}
            </div>
            <div className="grid grid-2" style={{ gap: 8 }}>
              {group(type).map((s) => {
                const on = values.serviceIds.includes(s.id);
                return (
                  <label key={s.id} className={`check-card${on ? ' checked' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(s.id)} />
                    <span style={{ flex: 1 }}>
                      <span className="strong small">{s.name}</span>
                      {s.modality && <span className="small muted"> · {s.modality}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {errors.serviceIds && <span className="field-error">{errors.serviceIds}</span>}

        <div className="form-grid">
          <Field label="Diagnosis (ICD-10, optional)" error={errors.icd10Code || errors['diagnosis.icd10Code']} hint="e.g. E11.9, J18.9, I10">
            <input className="input mono" value={values.icd10Code} onChange={(e) => setValues({ ...values, icd10Code: e.target.value })} placeholder="J18.9" />
          </Field>
          <Field label="Diagnosis description" error={errors.diagnosisText}>
            <input className="input" value={values.diagnosisText} onChange={(e) => setValues({ ...values, diagnosisText: e.target.value })} placeholder="Pneumonia, unspecified organism" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
