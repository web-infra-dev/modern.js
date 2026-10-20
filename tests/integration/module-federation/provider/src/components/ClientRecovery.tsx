export default function Recovery({ mfData }: { mfData?: { source: string } }) {
  return (
    <article className="recovery" data-testid="client-recovery">
      <small>天气数据恢复</small>
      <h2>余杭区</h2>
      <div className="recovery-temperature">{mfData ? '30°' : '—°'}</div>
      <p>{mfData ? '局部多云 · 天气预报已恢复' : '正在恢复天气数据…'}</p>
      <p data-testid="data-source">{mfData?.source || 'Recovering data…'}</p>
    </article>
  );
}
