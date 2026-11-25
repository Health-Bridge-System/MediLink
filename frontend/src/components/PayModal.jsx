import { useState } from 'react';
import Field from './ui/Field.jsx';
import Modal from './ui/Modal.jsx';
import { api } from '../lib/api.js';
import { balanceOf, money } from '../lib/format.js';
import { check, paymentSchema } from '../lib/schemas.js';
import { useToast } from '../lib/ToastContext.jsx';

const METHODS = [
  ['CARD', 'Card'],
  ['CASH', 'Cash'],
  ['INSURANCE', 'Insurance'],
];

export default function PayModal({ invoice, onClose, onPaid }) {
  const toast = useToast();
  const balance = balanceOf(invoice);
  const [values, setValues] = useState({ amount: balance.toFixed(2), method: 'CARD' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const { data, errors: errs } = check(paymentSchema(balance), values);
    setErrors(errs);
    if (!data) return;
    setBusy(true);
    try {
      const updated = await api.post(`/invoices/${invoice.id}/payments`, data);
      toast.success('Payment recorded', `${money(data.amount)} · invoice is now ${updated.paymentStatus.toLowerCase()}`);
      onPaid(updated);
    } catch (err) {
      setErrors(err.fieldErrors);
      toast.error('Payment failed', err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Pay INV-${String(invoice.id).padStart(5, '0')}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />}
            Pay {values.amount ? money(values.amount) : ''}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="callout">
          Total {money(invoice.total)} · remaining balance <b>{money(balance)}</b>
        </div>
        <Field label="Amount (EGP)" error={errors.amount}>
          <input className="input" inputMode="decimal" value={values.amount} onChange={(e) => setValues({ ...values, amount: e.target.value })} />
        </Field>
        <Field label="Method" error={errors.method}>
          <div className="segmented">
            {METHODS.map(([v, l]) => (
              <button key={v} type="button" className={values.method === v ? 'on' : ''} onClick={() => setValues({ ...values, method: v })}>
                {l}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
