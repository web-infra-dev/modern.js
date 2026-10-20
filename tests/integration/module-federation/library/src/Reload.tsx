export default function Reload({
  mfData,
}: {
  mfData?: { requestCount: number };
}) {
  return (
    <div className="request-meter">
      <span>余杭区 · 天气更新</span>
      <div className="lifecycle-temperature">30°</div>
      <p>局部多云，傍晚有短时阵雨。</p>
      <span>本次天气数据批次</span>
      <strong data-testid="request-count">{mfData?.requestCount ?? '—'}</strong>
    </div>
  );
}
