import Field from './ui/Field.jsx';

// The patient columns from the ERD, shared by registration and the
// receptionist's "new patient" form.
export default function PatientFields({ values, errors, onChange }) {
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });
  return (
    <>
      <Field label="Full name" error={errors.fullName} className="span-2">
        <input className="input" value={values.fullName} onChange={set('fullName')} />
      </Field>
      <Field label="National ID" error={errors.nationalId} hint="14 digits">
        <input className="input mono" inputMode="numeric" maxLength={14} value={values.nationalId} onChange={set('nationalId')} />
      </Field>
      <Field label="Birth date" error={errors.birthDate}>
        <input className="input" type="date" value={values.birthDate} onChange={set('birthDate')} max={new Date().toISOString().slice(0, 10)} />
      </Field>
      <Field label="Gender" error={errors.gender}>
        <select className="select" value={values.gender} onChange={set('gender')}>
          <option value="">Choose…</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
        </select>
      </Field>
      <Field label="Phone" error={errors.phone}>
        <input className="input" inputMode="tel" placeholder="+201…" value={values.phone} onChange={set('phone')} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input className="input" type="email" value={values.email} onChange={set('email')} />
      </Field>
      <Field label="Address" error={errors.address}>
        <input className="input" value={values.address} onChange={set('address')} />
      </Field>
    </>
  );
}

export const EMPTY_PATIENT = { fullName: '', nationalId: '', birthDate: '', gender: '', phone: '', email: '', address: '' };
