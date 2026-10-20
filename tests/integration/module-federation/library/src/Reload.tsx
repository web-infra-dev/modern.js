export default function Reload({
  mfData,
}: {
  mfData?: { requestCount: number };
}) {
  return (
    <div className="request-meter">
      <span>Remote data requests</span>
      <strong data-testid="request-count">{mfData?.requestCount ?? '—'}</strong>
    </div>
  );
}
