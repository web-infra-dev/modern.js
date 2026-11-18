import { useEffect, useRef, useState } from 'react';
import { LabIcon } from './LabIcon';
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
            <LabIcon name="play" />{' '}
            {preparing ? '准备资源…' : clicked ? '再次加载' : '加载'}
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
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
          />
        ))}
      </div>
    </>
  );
}
