import { useState } from 'react';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { toLocalInput } from '../lib/format.js';
import { appointmentSchema, check } from '../lib/schemas.js';
import { useToast } from '../lib/ToastContext.jsx';

function tomorrowAt10() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInput(d);
}

export default function BookAppointmentModal({ onClose, onBooked }) {
  const { is } = useAuth();
  const toast = useToast();
  const staffBooking = !is('PATIENT');
  const services = useApi('/services');
  const doctors = useApi('/staff?role=DOCTOR');
  const patients = useApi(staffBooking ? '/patients?pageSize=100' : null);
  const [values, setValues] = useState({ patientId: '', serviceId: '', staffId: '', dateTime: tomorrowAt10(), notes: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

  const submit = async () => {
    const { data, errors: errs } = check(appointmentSchema, values);
    if (staffBooking && !values.patientId) errs.patientId = 'Choose a patient';
    setErrors(errs);
    if (!data || errs.patientId) return;
    setBusy(true);
    try {
      const appt = await api.post('/appointments', { ...data, dateTime: new Date(data.dateTime).toISOString() });
      toast.success('Appointment booked', `${appt.service?.name} · HL7 SIU^S12 sent to the EMR`);
      onBooked(appt);
    } catch (err) {
      setErrors(err.fieldErrors);
      toast.error('Could not book', err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Book an appointment"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />}
            Book
          </button>
        </>
      }
    >
      <div className="form-grid">
        {staffBooking && (
          <Field label="Patient" error={errors.patientId} className="span-2">
            <select className="select" value={values.patientId} onChange={set('patientId')}>
              <option value="">Choose a patient…</option>
              {patients.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} · {p.nationalId}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Service" error={errors.serviceId} className="span-2">
          <select className="select" value={values.serviceId} onChange={set('serviceId')}>
            <option value="">Choose a test or scan…</option>
            {['LAB', 'RADIOLOGY'].map((type) => (
              <optgroup key={type} label={type === 'LAB' ? 'Laboratory' : 'Imaging'}>
                {services.data
                  ?.filter((s) => s.type === type)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Doctor (optional)" error={errors.staffId}>
          <select className="select" value={values.staffId} onChange={set('staffId')}>
            <option value="">Any available doctor</option>
            {doctors.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} · {d.specialty}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date & time" error={errors.dateTime} hint="Open 08:00–20:00">
          <input className="input" type="datetime-local" step={900} value={values.dateTime} onChange={set('dateTime')} />
        </Field>
        <Field label="Notes" error={errors.notes} className="span-2">
          <input className="input" value={values.notes} onChange={set('notes')} placeholder="Fasting, referral, symptoms…" />
        </Field>
      </div>
    </Modal>
  );
}
