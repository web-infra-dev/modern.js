import { useEffect, useRef, useState } from 'react';
import { LabPanel } from './LabPanel';
import { prefetchApplicationResources } from './application-prefetch';

export function ServiceLoadComparison() {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(0);
  const [data, setData] = useState(false);
  const [preload, setPreload] = useState(false);
  const [run, setRun] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const [clicked, setClicked] = useState(false);
  const serial = useRef(0);
  useEffect(() => {
    const seen = new Set<MessageEventSource>();
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.data?.type !== 'mf-lab-bench-ready'
      )
        return;
      const frames = Array.from(
        container.current?.querySelectorAll('iframe') || [],
      );
      if (
        !frames.some(frame => frame.contentWindow === event.source) ||
        !event.source
      )
        return;
      seen.add(event.source);
      setReady(seen.size);
    };
    addEventListener('message', receive);
    return () => removeEventListener('message', receive);
  }, [run]);
  async function prepare(nextPreload: boolean) {
    setClicked(false);
    setReady(0);
    setError('');
    setPreparing(true);
    try {
      if (nextPreload)
        await Promise.all([
          prefetchApplicationResources('service'),
          prefetchApplicationResources('bridge'),
        ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setRun(value => value + 1);
      setPreparing(false);
    }
  }
  return (
    <>
      <section className="lab-controls">
        <h2>点击后加载 · 点击起算</h2>
        <div className="lab-control-row">
          <label>
            <input
              type="checkbox"
              data-testid="service-compare-data"
              checked={data}
              disabled={preparing}
              onChange={event => {
                setData(event.target.checked);
                void prepare(preload);
              }}
            />
            应用 data loader
          </label>
          <label>
            <input
              type="checkbox"
              data-testid="service-compare-prefetch"
              checked={preload}
              disabled={preparing}
              onChange={event => {
                setPreload(event.target.checked);
                void prepare(event.target.checked);
              }}
            />
            提前加载浏览器资源
          </label>
          <button
            className="lab-primary"
            data-testid="service-compare-load"
            disabled={ready !== 2 || preparing || Boolean(error)}
            onClick={() => {
              const message = {
                type: 'mf-lab-bench-start',
                id: ++serial.current,
                at: performance.timeOrigin + performance.now(),
              };
              container.current
                ?.querySelectorAll('iframe')
                .forEach(frame =>
                  frame.contentWindow?.postMessage(message, location.origin),
                );
              setClicked(true);
            }}
          >
            {preparing ? '准备资源…' : clicked ? '再次点击加载' : '点击加载'}
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p className="lab-note">
          两侧宿主均为 CSR，点击前不挂载应用。左侧通过 Service
          流接口渲染，右侧在浏览器中运行同一 Bridge
          应用。两项时间都从同一次点击起算；资源预加载耗时不计入点击后的时间，SSR
          响应流不预取、不复用。
        </p>
      </section>
      <div className="lab-render-grid" ref={container}>
        {(['service', 'bridge'] as const).map(kind => (
          <LabPanel
            key={kind}
            name={kind === 'service' ? 'Service App' : 'Bridge CSR'}
            path={
              kind === 'service'
                ? '/service/forecast/today'
                : '/bridge-ssr/forecast/today'
            }
            query={`labFrame=1&bench=${kind}&labData=${data ? 'loader' : 'local'}`}
            run={run}
            refresh={0}
            inspect={false}
            paletteSeed=""
            fit
            description="点击起算"
          />
        ))}
      </div>
    </>
  );
}
