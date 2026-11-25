// Reference ranges for the lab services in our catalogue, keyed by
// service name. `critLow` / `critHigh` are panic values that must trigger a
// CRITICAL flag and a CDSS alert. Values are typical adult ranges for demo use.
export const LAB_PANELS = {
  'Complete Blood Count (CBC)': [
    { testName: 'WBC', unit: '10^9/L', low: 4.0, high: 11.0, critLow: 2.0, critHigh: 30.0 },
    { testName: 'Hemoglobin', unit: 'g/dL', low: 12.0, high: 17.5, critLow: 7.0, critHigh: 20.0 },
    { testName: 'Platelets', unit: '10^9/L', low: 150, high: 450, critLow: 50, critHigh: 1000 },
  ],
  'Basic Metabolic Panel': [
    { testName: 'Sodium', unit: 'mmol/L', low: 135, high: 145, critLow: 120, critHigh: 160 },
    { testName: 'Potassium', unit: 'mmol/L', low: 3.5, high: 5.1, critLow: 2.8, critHigh: 6.2 },
    { testName: 'Glucose', unit: 'mg/dL', low: 70, high: 99, critLow: 50, critHigh: 400 },
    { testName: 'Creatinine', unit: 'mg/dL', low: 0.6, high: 1.3, critHigh: 5.0 },
  ],
  'Lipid Panel': [
    { testName: 'Total Cholesterol', unit: 'mg/dL', high: 200 },
    { testName: 'LDL', unit: 'mg/dL', high: 130 },
    { testName: 'HDL', unit: 'mg/dL', low: 40 },
    { testName: 'Triglycerides', unit: 'mg/dL', high: 150, critHigh: 1000 },
  ],
  'HbA1c': [{ testName: 'HbA1c', unit: '%', low: 4.0, high: 5.6, critHigh: 14 }],
  'Thyroid Stimulating Hormone (TSH)': [{ testName: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0, critHigh: 50 }],
  'Liver Function Test': [
    { testName: 'ALT', unit: 'U/L', low: 7, high: 56, critHigh: 1000 },
    { testName: 'AST', unit: 'U/L', low: 10, high: 40, critHigh: 1000 },
    { testName: 'Bilirubin (total)', unit: 'mg/dL', low: 0.1, high: 1.2, critHigh: 15 },
  ],
};

export function rangeText(analyte) {
  if (analyte.low !== undefined && analyte.high !== undefined) return `${analyte.low}-${analyte.high}`;
  if (analyte.high !== undefined) return `< ${analyte.high}`;
  if (analyte.low !== undefined) return `> ${analyte.low}`;
  return null;
}

export function findAnalyte(serviceName, testName) {
  return (LAB_PANELS[serviceName] ?? []).find((a) => a.testName.toLowerCase() === testName.toLowerCase());
}

export function computeFlag(analyte, rawValue) {
  const value = Number(rawValue);
  if (!analyte || !Number.isFinite(value)) return 'NORMAL';
  if ((analyte.critLow !== undefined && value <= analyte.critLow) || (analyte.critHigh !== undefined && value >= analyte.critHigh)) {
    return 'CRITICAL';
  }
  if (analyte.low !== undefined && value < analyte.low) return 'LOW';
  if (analyte.high !== undefined && value > analyte.high) return 'HIGH';
  return 'NORMAL';
}
