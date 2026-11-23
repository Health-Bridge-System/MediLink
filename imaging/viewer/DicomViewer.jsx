import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { applyWindow, renderSlice, SIZE } from './syntheticImage.js';

// The viewer is self-contained (imaging/ is kept apart from the main UI),
// so it carries its own two small helpers.
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const date = (v) => (v ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v)) : '—');

const PRESETS = {
  Default: { width: 255, level: 128 },
  'Soft tissue': { width: 170, level: 110 },
  Lung: { width: 150, level: 55 },
  Bone: { width: 110, level: 190 },
};
const PIXEL_MM = { CR: 0.7, DX: 0.5, CT: 0.75, MR: 0.9, US: 0.3 };

export default function DicomViewer({ study, series, patient, canMeasure, onMeasure }) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const [wl, setWl] = useState(PRESETS.Default);
  const [invert, setInvert] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [slice, setSlice] = useState(0);
  const [tool, setTool] = useState('pan');
  const [pending, setPending] = useState([]);

  const total = Math.max(1, series.numInstances ?? 1);
  const modality = series.modality ?? 'CR';

  useEffect(() => {
    setSlice(Math.floor(total / 2));
    setPending([]);
  }, [series.id, total]);

  const lum = useMemo(
    () => renderSlice({ modality, seed: series.id, slice, total, bodyPart: series.bodyPart }),
    [modality, series.id, slice, total, series.bodyPart],
  );

  // 1) window/level into an offscreen canvas
  useEffect(() => {
    if (!offRef.current) {
      offRef.current = document.createElement('canvas');
      offRef.current.width = SIZE;
      offRef.current.height = SIZE;
    }
    const ctx = offRef.current.getContext('2d');
    const img = ctx.createImageData(SIZE, SIZE);
    ctx.putImageData(applyWindow(lum, img, { ...wl, invert }), 0, 0);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lum, wl, invert]);

  // 2) paint with zoom / pan / rotation, then the measurements on top
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.translate(SIZE / 2 + pan.x, SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-SIZE / 2, -SIZE / 2);
    ctx.drawImage(offRef.current, 0, 0);

    const marks = [...(series.annotations ?? []).map((a) => ({ ...a.geometry, type: a.type, saved: true })), ...(pending.length ? [{ points: pending, type: 'LENGTH' }] : [])];
    for (const m of marks) {
      ctx.strokeStyle = m.saved ? '#e0b45a' : '#8fb3d4';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      m.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      for (const p of m.points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5 / zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      if (m.value !== undefined) {
        const last = m.points.at(-1);
        ctx.font = `${13 / zoom}px JetBrains Mono, monospace`;
        ctx.fillText(`${m.value} ${m.unit === 'deg' ? '°' : m.unit}`, last.x + 8 / zoom, last.y - 8 / zoom);
      }
    }
  }, [pan, rotation, zoom, series.annotations, pending]);

  useEffect(draw, [draw]);

  useEffect(() => {
    if (prefersReducedMotion() || !canvasRef.current) return;
    gsap.fromTo(canvasRef.current, { autoAlpha: 0.2, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power2.out' });
  }, [series.id]);

  // Mouse wheel: zoom (or scroll slices with Shift)
  useEffect(() => {
    const el = stageRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.shiftKey && total > 1) setSlice((s) => Math.min(total - 1, Math.max(0, s + Math.sign(e.deltaY))));
      else setZoom((z) => Math.min(6, Math.max(0.5, z * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [total]);

  // Screen point → image coordinates (undo pan, rotation and zoom).
  const toImage = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * SIZE - SIZE / 2 - pan.x;
    const cy = ((e.clientY - rect.top) / rect.height) * SIZE - SIZE / 2 - pan.y;
    const a = (-rotation * Math.PI) / 180;
    const rx = cx * Math.cos(a) - cy * Math.sin(a);
    const ry = cx * Math.sin(a) + cy * Math.cos(a);
    return { x: Math.round(rx / zoom + SIZE / 2), y: Math.round(ry / zoom + SIZE / 2) };
  };

  const onPointerDown = (e) => {
    if (tool === 'measure') {
      const p = toImage(e);
      const pts = [...pending, p];
      if (pts.length === 2) {
        const mm = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) * (PIXEL_MM[modality] ?? 0.7);
        setPending([]);
        onMeasure?.(pts, Number(mm.toFixed(1)), slice);
      } else setPending(pts);
      return;
    }
    if (tool === 'wl') drag.current = { x: e.clientX, y: e.clientY, wl, mode: 'wl' };
    else drag.current = { x: e.clientX, y: e.clientY, pan, mode: 'pan' };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const k = SIZE / rect.width;
    if (d.mode === 'pan') setPan({ x: d.pan.x + (e.clientX - d.x) * k, y: d.pan.y + (e.clientY - d.y) * k });
    else setWl({ width: Math.max(10, d.wl.width + (e.clientX - d.x)), level: Math.min(255, Math.max(0, d.wl.level - (e.clientY - d.y))) });
  };

  const reset = () => {
    setWl(PRESETS.Default);
    setInvert(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setPending([]);
  };

  return (
    <div className="viewer">
      <div
        className="viewer-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        style={{ cursor: tool === 'measure' ? 'crosshair' : tool === 'wl' ? 'ns-resize' : undefined }}
      >
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: 'min(100%, 560px)', aspectRatio: '1' }} />
        <div className="viewer-overlay">
          <div className="tl">
            {patient.fullName}
            <br />
            ML-{String(patient.id).padStart(5, '0')} · {patient.gender === 'FEMALE' ? 'F' : 'M'}
            <br />
            {date(study.performedAt)}
          </div>
          <div className="tr">
            {modality} · {series.bodyPart}
            <br />
            {series.description}
            <br />
            Img {slice + 1}/{total}
          </div>
          <div className="bl">
            W {Math.round(wl.width)} · L {Math.round(wl.level)}
            {invert && ' · INV'}
            <br />
            Zoom {zoom.toFixed(2)}× · Rot {rotation}°
          </div>
        </div>
      </div>

      <div className="viewer-tools">
        <div>
          <h4>Mouse tool</h4>
          <div className="tool-btns" style={{ marginTop: 8 }}>
            {[
              ['pan', 'Pan'],
              ['wl', 'W/L drag'],
              ['measure', 'Measure'],
            ].map(([k, l]) => (
              <button key={k} className={`tool-btn${tool === k ? ' on' : ''}`} onClick={() => setTool(k)} disabled={k === 'measure' && !canMeasure} title={k === 'measure' && !canMeasure ? 'Clinicians only' : undefined}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4>Window / level</h4>
          <div className="tool-btns" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 8 }}>
            {Object.entries(PRESETS).map(([name, p]) => (
              <button key={name} className={`tool-btn${wl.width === p.width && wl.level === p.level ? ' on' : ''}`} onClick={() => setWl(p)}>
                {name}
              </button>
            ))}
          </div>
          <label className="small" style={{ display: 'block', marginTop: 10 }}>
            Width {Math.round(wl.width)}
            <input type="range" min="10" max="400" value={wl.width} onChange={(e) => setWl({ ...wl, width: Number(e.target.value) })} />
          </label>
          <label className="small" style={{ display: 'block' }}>
            Level {Math.round(wl.level)}
            <input type="range" min="0" max="255" value={wl.level} onChange={(e) => setWl({ ...wl, level: Number(e.target.value) })} />
          </label>
        </div>

        {total > 1 && (
          <div>
            <h4>Slice</h4>
            <input type="range" min="0" max={total - 1} value={slice} onChange={(e) => setSlice(Number(e.target.value))} />
            <div className="small" style={{ color: '#7d8896' }}>
              Shift + wheel to scroll
            </div>
          </div>
        )}

        <div>
          <h4>View</h4>
          <div className="tool-btns" style={{ marginTop: 8 }}>
            <button className="tool-btn" onClick={() => setZoom((z) => Math.min(6, z * 1.25))}>
              Zoom +
            </button>
            <button className="tool-btn" onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}>
              Zoom −
            </button>
            <button className="tool-btn" onClick={() => setRotation((r) => (r + 90) % 360)}>
              Rotate
            </button>
            <button className={`tool-btn${invert ? ' on' : ''}`} onClick={() => setInvert((v) => !v)}>
              Invert
            </button>
            <button className="tool-btn" onClick={reset} style={{ gridColumn: 'span 2' }}>
              Reset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
