// Talks to the Python CDSS service (FastAPI + PyTorch) at POST /analyze.
// When no URL is configured — as in this demo — a deterministic stub answers
// instead, so the rest of the workflow can be shown end to end.

const FINDINGS = {
  CR: ['No finding', 'Pneumonia', 'Pleural effusion', 'Cardiomegaly', 'Lung nodule'],
  DX: ['No finding', 'Pneumonia', 'Pleural effusion', 'Cardiomegaly', 'Lung nodule'],
  CT: ['No finding', 'Lung nodule', 'Consolidation', 'Emphysema'],
  MR: ['No finding', 'Mass lesion', 'White-matter hyperintensity', 'Hemorrhage'],
  US: ['No finding', 'Fatty liver', 'Gallstones'],
};

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function stubAnalyze({ studyUid, modality }) {
  const labels = FINDINGS[modality] ?? FINDINGS.CR;
  let seed = hash(studyUid);
  const next = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0) % 1000) / 1000;

  const raw = labels.map(() => 0.05 + next());
  const top = hash(studyUid + 'top') % labels.length;
  raw[top] += 1.6;
  const sum = raw.reduce((a, b) => a + b, 0);
  const scores = Object.fromEntries(labels.map((l, i) => [l, Number((raw[i] / sum).toFixed(4))]));

  return {
    model: `demo-stub/${modality === 'MR' ? 'monai-brain' : 'txrv-densenet121'}`,
    prediction: labels[top],
    confidence: scores[labels[top]],
    scores,
    heatmapPath: null,
    stub: true,
  };
}

export async function analyzeStudy({ studyId, studyUid, modality }, cdssUrl) {
  if (!cdssUrl) return stubAnalyze({ studyUid, modality });

  const res = await fetch(`${cdssUrl.replace(/\/$/, '')}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ study_id: studyId, dicom_study_uid: studyUid, modality }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`CDSS service responded ${res.status}`);
  const body = await res.json();
  return {
    model: body.model,
    prediction: body.prediction,
    confidence: body.confidence,
    scores: body.scores ?? null,
    heatmapPath: body.heatmap_path ?? null,
    stub: false,
  };
}
