// Pretty-prints a pipe-delimited HL7 v2 message: one segment per line,
// segment names and field separators highlighted.
export default function Hl7Raw({ text }) {
  const segments = text.split(/\r\n?|\n/);
  return (
    <pre className="hl7-raw">
      {segments.map((seg, i) => {
        const [name, ...fields] = seg.split('|');
        return (
          <div key={i}>
            <span className="seg">{name}</span>
            {fields.map((f, j) => (
              <span key={j}>
                <span className="sep">|</span>
                {f}
              </span>
            ))}
          </div>
        );
      })}
    </pre>
  );
}

// Field list for the selected segment, numbered the way the HL7 spec does
// (MSH-1 is the field separator itself, so MSH fields are shifted by one).
export function hl7Fields(text) {
  return text.split(/\r\n?|\n/).map((seg) => {
    const [name, ...fields] = seg.split('|');
    const offset = name === 'MSH' ? 2 : 1;
    return {
      name,
      fields: fields.map((value, i) => ({ id: `${name}-${i + offset}`, value })).filter((f) => f.value !== ''),
    };
  });
}
