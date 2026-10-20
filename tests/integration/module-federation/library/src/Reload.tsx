export default function Reload({
  mfData,
}: {
  mfData?: { requestCount: number };
}) {
  return (
    <div className="request-meter">
      <span>Yuhang · Weather update</span>
      <div className="lifecycle-temperature">30°</div>
      <p>Partly cloudy. Brief showers this evening.</p>
      <span>Weather request batch</span>
      <strong data-testid="request-count">{mfData?.requestCount ?? '—'}</strong>
    </div>
  );
}
