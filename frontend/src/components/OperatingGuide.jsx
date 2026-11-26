import React from 'react';
const steps=[
  {name:'Reception and patient registration',owner:'Receptionist · Administrator',details:'Search for existing patients before registering. Confirm legal identity and contact information. Schedule a visit using an existing service and an assigned doctor; update appointment status when the patient arrives.'},
  {name:'Doctor consultation and diagnostic orders',owner:'Doctor',details:'Open the patient history and review the clinical record. Place laboratory or radiology orders by selecting approved services and priority. Only doctors can create diagnostic orders. Cancel an active order only when the downstream state permits it.'},
  {name:'Laboratory processing',owner:'Laboratory technician',details:'Open Awaiting Work, review the order and patient details, start the appropriate test, then enter measured values from a verified laboratory source. Completed records are retained; correcting released results requires a governed amendment workflow.'},
  {name:'Radiology reporting',owner:'Radiologist',details:'Review a study and create draft findings. Final signatures should only occur after a validated external imaging workflow, since real DICOM decoding is not implemented in this build.'},
  {name:'Payments and invoices',owner:'Administrator',details:'Invoices are created by the backend on completed orders. Review line items, outstanding balances, and actual payment history; record only independently confirmed cash, card, or insurance payments.'},
  {name:'Catalog, audit and integrations',owner:'Administrator',details:'Manage catalog entries and pricing, inspect restricted audit entries, review stored HL7 messages, and validate integration failures. Stored ACK statuses do not prove successful exchange with an external clinical system.'},
];
export default function OperatingGuide(){return <div className="ml-stack"><div className="ml-heading"><h1>Workflow guide</h1><p>Who performs each operation and what the next step is.</p></div>
  <section className="ml-pane"><h2>Day-to-day workflow</h2><p className="ml-small">All records and permissions are enforced by the backend, not this guide.</p>
   <div className="ml-guide-grid">{steps.map((s,i)=><article className="ml-record-box" key={i}><span className="ml-step-index">{String(i+1).padStart(2,'0')}</span><h3>{s.name}</h3><p className="ml-guide-owner">{s.owner}</p><p>{s.details}</p></article>)}</div>
  </section>
  <section className="ml-pane"><h2>Before any real patient use</h2><p>This is an engineering validation build. Security hardening, account provisioning, backup and restore testing, privacy impact assessment, clinically validated workflows, and jurisdiction-specific authorization must be completed first. No real DICOM ingestion or AI diagnostic inference is included.</p></section>
</div>}
