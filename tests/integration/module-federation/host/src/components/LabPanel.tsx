import {
  prefetchApplicationResources,
  type ApplicationKind,
} from './application-prefetch';
import { useCallback, useEffect, useRef, useState } from 'react';

export function LabPanel({
  name,
  path = '/weather',
  query,
  run,
  inspect,
  paletteSeed,
  refresh,
  fit = false,
  description,
  preloadApplication,
}: {
  name: string;
  path?: string;
  query: string;
  run: number;
  inspect: boolean;
  paletteSeed: string;
  refresh: number;
  fit?: boolean;
  description?: string;
  preloadApplication?: ApplicationKind;
}) {
  const preparationKey = `${path}?${query}:${run}:${refresh}`;
  const [prepared, setPrepared] = useState<{
    key: string;
    error?: string;
    ms?: number;
  }>();
  useEffect(() => {
    if (!preloadApplication) return;
    let cancelled = false;
    const started = performance.now();
    prefetchApplicationResources(preloadApplication).then(
      () => {
        if (!cancelled)
          setPrepared({
            key: preparationKey,
            ms: Math.round(performance.now() - started),
          });
      },
      error => {
        if (!cancelled)
          setPrepared({
            key: preparationKey,
            error: error instanceof Error ? error.message : String(error),
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [preloadApplication, preparationKey]);
  const canNavigate =
    !preloadApplication ||
    (prepared?.key === preparationKey && !prepared.error);
  const frame = useRef<HTMLIFrameElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!fit || !viewport.current) {
      setScale(1);
      return;
    }
    const element = viewport.current;
    const compact = new URLSearchParams(query).get('compact') === '1';
    const minimumHeight = path === '/weather' ? (compact ? 350 : 520) : 1050;
    const resize = () =>
      setScale(
        Math.min(
          1,
          element.clientWidth / 640,
          element.clientHeight / minimumHeight,
        ),
      );
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, [fit, path, query]);
  const inspectRef = useRef(inspect);
  inspectRef.current = inspect;
  const sendInspect = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      { type: 'mf-lab-bench-query' },
      window.location.origin,
    );
    frame.current?.contentWindow?.postMessage(
      { type: 'mf-weather-metrics-request' },
      window.location.origin,
    );
    frame.current?.contentWindow?.postMessage(
      { type: 'mf-lab-inspect', enabled: inspectRef.current, paletteSeed },
      window.location.origin,
    );
  }, [paletteSeed]);
  useEffect(sendInspect, [inspect, run, sendInspect]);
  const benchID = useRef<number | undefined>(undefined);
  const [recovery, setRecovery] = useState('');
  const [events, setEvents] = useState<Record<string, number>>({});
  const [methods, setMethods] = useState<Record<string, string>>({});
  useEffect(() => {
    setEvents({});
    setMethods({});
    setRecovery('');
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data?.type === 'mf-lab-bench-reset') {
        benchID.current = event.data.id;
        setEvents({});
        setMethods({});
        return;
      }
      if (
        event.data?.type === 'mf-lab-recovery' &&
        typeof event.data.status === 'string'
      ) {
        setRecovery(event.data.status);
        return;
      }
      if (
        event.data?.type === 'mf-lab-inspect-ready' ||
        event.data?.type === 'mf-weather-metrics-ready'
      ) {
        sendInspect();
        return;
      }
      if (event.data?.type !== 'mf-weather') return;
      if (
        new URLSearchParams(query).has('bench') &&
        event.data.id !== benchID.current
      )
        return;
      if (
        ![
          'Client ready',
          'Data visible',
          'Data request failed',
          'Data prefetch started',
        ].includes(event.data.event) ||
        typeof event.data.at !== 'number'
      )
        return;
      if (typeof event.data.method === 'string')
        setMethods(previous => ({
          ...previous,
          [event.data.event]: event.data.method,
        }));
      setEvents(previous => ({
        ...previous,
        [event.data.event]: previous[event.data.event] ?? event.data.at,
      }));
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [run, refresh, query, sendInspect]);
  return (
    <section className="comparison-panel">
      <div className="comparison-sky" aria-hidden="true">
        <div className="sky-cloud cloud-one" />
        <div className="sky-cloud cloud-two" />
      </div>
      <header>
        <h2>
          {name}
          {description && (
            <small className="lab-mode-note">{description}</small>
          )}
          {recovery && (
            <small className="recovery-badge" role="status">
              {recovery}
            </small>
          )}
        </h2>
        <span className="lab-panel-state">
          {events['Client ready'] !== undefined
            ? '● Client ready'
            : events['Data prefetch started'] !== undefined
              ? '◌ Prefetching data'
              : '◌ Waiting for client'}
        </span>
        {!new URLSearchParams(query).has('bench') && (
          <a
            className="lab-panel-open"
            href={`${path}?${query}`}
            target="_blank"
            rel="noreferrer"
            title={`单独查看 ${name}`}
            aria-label={`单独查看 ${name}`}
          >
            ↗
          </a>
        )}
      </header>
      <div className="lab-frame-viewport" ref={viewport}>
        {!canNavigate ? (
          <p role={prepared?.error ? 'alert' : 'status'}>
            {prepared?.error || '正在提前加载浏览器资源…'}
          </p>
        ) : (
          <iframe
            key={`${run}:${refresh}`}
            data-testid={name === 'SSR' ? 'ssr-frame' : undefined}
            ref={frame}
            title={name}
            onLoad={sendInspect}
            src={`${path}?${query}&run=${run}&sharedSky=1`}
            sandbox="allow-scripts allow-same-origin"
            style={
              fit && scale > 0
                ? {
                    width: `${100 / scale}%`,
                    height: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                  }
                : undefined
            }
          />
        )}
      </div>
      {preloadApplication && prepared?.ms !== undefined && (
        <small>资源准备 {prepared.ms} ms（导航前，不计入下方时间）</small>
      )}
      <footer>
        {['Data visible', 'Client ready'].map(event => (
          <span
            key={event}
            data-metric={event}
            title={
              event === 'Data visible'
                ? methods[event] === 'visibility estimate'
                  ? 'Estimated visibility of temperature and condition after intersection and a paint opportunity.'
                  : `${new URLSearchParams(query).has('bench') ? 'From the common click' : 'From frame navigation'} to the first paint of temperature and condition (Element Timing).`
                : `${new URLSearchParams(query).has('bench') ? 'From the common click' : 'From frame navigation'} until all key controls have hydrated or mounted: save station, hourly forecast, and wind when shown. Independent of weather data.`
            }
          >
            {event}
            <b>
              {events[event] === undefined
                ? '—'
                : `${methods[event] === 'visibility estimate' ? '≈ ' : ''}${events[event]} ms`}
            </b>
          </span>
        ))}
      </footer>
    </section>
  );
}
