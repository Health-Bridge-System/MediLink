// Draws anatomy-like grayscale test images for the demo viewer, so the
// viewer tools (window/level, zoom, pan, rotate, invert, slices, measure)
// work before Orthanc + Cornerstone3D are connected in Phase 3.
// No real patient data is involved.

export const SIZE = 512;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const gray = (v) => `rgb(${v},${v},${v})`;

function chest(ctx, r, slice) {
  ctx.fillStyle = gray(70);
  ctx.beginPath();
  ctx.ellipse(256, 290, 210, 250, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(18);
  for (const x of [170, 342]) {
    ctx.beginPath();
    ctx.ellipse(x, 270, 78, 150, x < 256 ? 0.08 : -0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = gray(150);
  ctx.beginPath();
  ctx.ellipse(285, 330, 70, 82, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(200);
  ctx.fillRect(244, 80, 24, 420);
  ctx.strokeStyle = gray(165);
  ctx.lineWidth = 7;
  for (let i = 0; i < 9; i++) {
    const y = 150 + i * 34;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.bezierCurveTo(256 + dir * 90, y - 30, 256 + dir * 170, y + 10, 256 + dir * 175, y + 46);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 10;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(256 + dir * 20, 120);
    ctx.quadraticCurveTo(256 + dir * 110, 95, 256 + dir * 190, 118);
    ctx.stroke();
  }
  if (slice % 2 === 0 || r() > 0.5) {
    ctx.fillStyle = 'rgba(140,140,140,0.35)';
    ctx.beginPath();
    ctx.ellipse(175, 360, 42, 34, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function knee(ctx) {
  ctx.fillStyle = gray(60);
  ctx.beginPath();
  ctx.ellipse(256, 256, 150, 250, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(210);
  ctx.beginPath();
  ctx.moveTo(196, 0);
  ctx.lineTo(316, 0);
  ctx.quadraticCurveTo(340, 200, 330, 228);
  ctx.quadraticCurveTo(256, 260, 182, 228);
  ctx.quadraticCurveTo(172, 200, 196, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(180, 262);
  ctx.quadraticCurveTo(256, 246, 332, 262);
  ctx.lineTo(312, 512);
  ctx.lineTo(206, 512);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = gray(190);
  ctx.beginPath();
  ctx.ellipse(350, 300, 20, 40, 0, 0, Math.PI * 2);
  ctx.fill();
}

function ctChest(ctx, r, slice, total) {
  const t = total > 1 ? slice / (total - 1) : 0.5;
  const lung = 0.6 + Math.sin(t * Math.PI) * 0.4;
  ctx.fillStyle = gray(105);
  ctx.beginPath();
  ctx.ellipse(256, 270, 220, 160, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(10);
  for (const x of [170, 342]) {
    ctx.beginPath();
    ctx.ellipse(x, 255, 70 * lung, 110 * lung, x < 256 ? -0.15 : 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = gray(150);
  ctx.beginPath();
  ctx.arc(268, 230, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(240);
  ctx.beginPath();
  ctx.arc(256, 380, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(105);
  ctx.beginPath();
  ctx.arc(256, 380, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = gray(40);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 60; i++) {
    const x = (r() > 0.5 ? 170 : 342) + (r() - 0.5) * 110 * lung;
    const y = 255 + (r() - 0.5) * 170 * lung;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30);
    ctx.strokeStyle = gray(60);
    ctx.stroke();
  }
  if (Math.abs(t - 0.45) < 0.12) {
    ctx.fillStyle = gray(130);
    ctx.beginPath();
    ctx.arc(150, 210, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = gray(90);
  ctx.fillRect(40, 470, 432, 10);
}

function mrBrain(ctx, r, slice, total) {
  const t = total > 1 ? slice / (total - 1) : 0.5;
  const s = 0.75 + Math.sin(t * Math.PI) * 0.25;
  ctx.fillStyle = gray(230);
  ctx.beginPath();
  ctx.ellipse(256, 256, 190 * s, 230 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(40);
  ctx.beginPath();
  ctx.ellipse(256, 256, 176 * s, 216 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(135);
  ctx.beginPath();
  ctx.ellipse(256, 256, 168 * s, 208 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = gray(165);
  ctx.lineWidth = 3;
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2;
    const rad = (0.55 + r() * 0.4) * 165 * s;
    const x = 256 + Math.cos(a) * rad;
    const y = 256 + Math.sin(a) * rad * 1.22;
    ctx.beginPath();
    ctx.arc(x, y, 6 + r() * 10, a, a + 2.2);
    ctx.stroke();
  }
  ctx.fillStyle = gray(235);
  const v = 1.2 - Math.abs(t - 0.5);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(256 + dir * 22 * v, 240, 14 * v, 48 * v, dir * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = gray(200);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(200 + r() * 110, 170 + r() * 150, 3 + r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function ultrasound(ctx, r, slice) {
  ctx.fillStyle = gray(0);
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(256, 40);
  ctx.arc(256, 40, 440, Math.PI * 0.28, Math.PI * 0.72);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 9000; i++) {
    const v = 40 + r() * 90;
    ctx.fillStyle = gray(Math.round(v));
    ctx.fillRect(r() * SIZE, r() * SIZE, 2 + r() * 3, 1 + r() * 2);
  }
  ctx.fillStyle = 'rgba(150,150,150,0.55)';
  ctx.beginPath();
  ctx.ellipse(230 + slice * 2, 260, 150, 90, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(8);
  ctx.beginPath();
  ctx.ellipse(320, 330, 34, 22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const DRAW = { CR: chest, DX: knee, CT: ctChest, MR: mrBrain, US: ultrasound };

// Returns a Uint8ClampedArray of luminance values (SIZE × SIZE).
export function renderSlice({ modality, seed, slice = 0, total = 1, bodyPart }) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const r = rng(seed * 7919 + slice * 104729);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.filter = modality === 'US' ? 'blur(0.6px)' : 'blur(2.2px)';
  const draw = modality === 'DX' && bodyPart === 'CHEST' ? chest : (DRAW[modality] ?? chest);
  draw(ctx, r, slice, total);
  ctx.filter = 'none';

  const img = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const lum = new Uint8ClampedArray(SIZE * SIZE);
  const noise = modality === 'US' ? 6 : modality === 'MR' ? 10 : 7;
  for (let i = 0; i < lum.length; i++) lum[i] = img[i * 4] + (r() - 0.5) * noise;
  return lum;
}

// Applies window width / level (and optional invert) to luminance values.
export function applyWindow(lum, target, { width, level, invert }) {
  const lo = level - width / 2;
  const out = target.data;
  for (let i = 0; i < lum.length; i++) {
    let v = ((lum[i] - lo) / width) * 255;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    if (invert) v = 255 - v;
    const j = i * 4;
    out[j] = out[j + 1] = out[j + 2] = v;
    out[j + 3] = 255;
  }
  return target;
}
