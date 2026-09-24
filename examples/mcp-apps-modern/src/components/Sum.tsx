export default function Sum({
  a,
  b,
  sum,
}: { a?: number; b?: number; sum?: number }) {
  return (
    <section style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Addition</h1>
      <p style={{ fontSize: 28 }}>
        {a ?? '—'} + {b ?? '—'} = {sum ?? '—'}
      </p>
    </section>
  );
}
