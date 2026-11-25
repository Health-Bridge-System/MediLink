import { useState } from 'react';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import PatientFields, { EMPTY_PATIENT } from './PatientFields.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { useToast } from '../lib/ToastContext.jsx';
import { check, registerSchema } from '../lib/schemas.js';

export default function RegisterModal({ onClose }) {
  const { register } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ ...EMPTY_PATIENT, username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const { data, errors: errs } = check(registerSchema, values);
    setErrors(errs);
    if (!data) return;
    setBusy(true);
    try {
      const user = await register(data);
      toast.success('Account created', `Welcome to MediLink, ${user.name}. An HL7 ADT^A04 was sent to the EMR.`);
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      toast.error('Registration failed', err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Create a patient account"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />}
            Create account
          </button>
        </>
      }
    >
      <div className="form-grid">
        <PatientFields values={values} errors={errors} onChange={setValues} />
        <Field label="Username" error={errors.username}>
          <input className="input" autoComplete="username" value={values.username} onChange={(e) => setValues({ ...values, username: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password} hint="8+ characters with a letter and a number">
          <input className="input" type="password" autoComplete="new-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
