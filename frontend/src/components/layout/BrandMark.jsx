export default function BrandMark({ size = 36 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 13h4l2-5 3 10 2.5-7 1.5 2H21" />
      </svg>
    </span>
  );
}
