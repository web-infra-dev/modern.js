export default function Recovery({ mfData }: { mfData?: { source: string } }) {
  return (
    <article className="recovery" data-testid="server-recovery">
      <small>RECOVERY COMPLETE</small>
      <h2>Another route to the same data.</h2>
      <p data-testid="data-source">{mfData?.source || 'Recovering data…'}</p>
    </article>
  );
}
