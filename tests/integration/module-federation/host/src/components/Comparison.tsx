import {
  FailureControls,
  renderFailures,
  dataFailures,
} from '../failure/Controls';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@modern-js/runtime/router';
function inspectPaletteSeed() {
  if (typeof window === 'undefined') return '';
  const seed = window.crypto.randomUUID();
  try {
    const key = 'mf-lab.inspect-palette';
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    window.sessionStorage.setItem(key, seed);
  } catch {
    // The parent still supplies one shared palette if storage is unavailable.
  }
  return seed;
}
export function LabNav() {
  return (
    <nav className="weather-nav" aria-label="Comparison pages">
      <Link className="weather-brand" to="/">
        ◈ Weather Lab
      </Link>
      <div>
        <Link to="/">Rendering</Link>
        <Link to="/data">Data fetching</Link>
        <Link to="/advanced">Advanced scenarios</Link>
      </div>
    </nav>
  );
}
function Panel({
  name,
  query,
  run,
  inspect,
  paletteSeed,
}: {
  name: string;
  query: string;
  run: number;
  inspect: boolean;
  paletteSeed: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const inspectRef = useRef(inspect);
  inspectRef.current = inspect;
  const sendInspect = useCallback(() => {
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
  }, [run, sendInspect]);
  return (
    <section className="comparison-panel">
      <div className="comparison-sky" aria-hidden="true">
        <div className="sky-cloud cloud-one" />
        <div className="sky-cloud cloud-two" />
      </div>
      <header>
        <h2>
          {name}
          {recovery && (
            <small className="recovery-badge" role="status">
              {recovery}
            </small>
          )}
        </h2>
        <span>
          {events['Client ready'] !== undefined
            ? '● Client ready'
            : events['Data prefetch started'] !== undefined
              ? '◌ Prefetching data'
              : '◌ Waiting for client'}
        </span>
      </header>
      <iframe
        key={run}
        ref={frame}
        title={name}
        onLoad={sendInspect}
        src={`/weather?${query}&run=${run}&sharedSky=1`}
        sandbox="allow-scripts allow-same-origin"
      />
      <footer>
        {['Data visible', 'Client ready'].map(event => (
          <span
            key={event}
            data-metric={event}
            title={
              event === 'Data visible'
                ? methods[event] === 'visibility estimate'
                  ? 'Estimated visibility of temperature and condition after intersection and a paint opportunity.'
                  : 'From frame navigation to the first paint of temperature and condition (Element Timing).'
                : 'From frame navigation until all key controls have hydrated or mounted: save station, hourly forecast, and wind when shown. Independent of weather data.'
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
export default function Comparison({ data = false }: { data?: boolean }) {
  const [run, setRun] = useState(0);
  const [delay, setDelay] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [failureEnabled, setFailureEnabled] = useState(false);
  const [failure, setFailure] = useState('network');
  const [target, setTarget] = useState('provider/Weather');
  const [prefetch, setPrefetch] = useState(true);
  const [paletteSeed] = useState(inspectPaletteSeed);
  const panels = data
    ? [
        ['CSR', 'render=csr&csr=1&data=client'],
        ['SSR', 'render=ssr&data=client'],
        ['CSR + data-fetch', 'render=csr&csr=1&data=mf'],
        ['SSR + data-fetch', 'render=ssr&data=mf'],
      ]
    : [
        ['CSR', 'render=csr&csr=1&data=local'],
        ['SSR', 'render=ssr&data=local'],
      ];
  return (
    <div className="comparison-shell">
      <LabNav />
      <header className="comparison-toolbar" aria-label="Comparison controls">
        <div className="comparison-controls">
          <FailureControls
            enabled={failureEnabled}
            kind={failure}
            options={
              data
                ? [...renderFailures, ...dataFailures]
                : target.includes('nested/')
                  ? [
                      ...renderFailures,
                      ['inner-network', 'Inner remote network failure'],
                    ]
                  : renderFailures
            }
            onChange={(enabled, kind) => {
              setFailureEnabled(enabled);
              setFailure(kind);
              if (enabled || enabled !== failureEnabled)
                setRun(value => value + 1);
            }}
          />
          {!data && (
            <select
              aria-label="Failure target"
              value={target}
              onChange={event => {
                setTarget(event.target.value);
                if (failure === 'inner-network') setFailure('network');
                setRun(value => value + 1);
              }}
            >
              <option value="provider/Weather">Current weather</option>
              <option value="dynamic/WeatherHourly">
                Dynamic hourly forecast
              </option>
              <option value="nested/WeatherDays">Nested daily forecast</option>
              <option value="nested/WeatherWind">Dynamic nested wind</option>
            </select>
          )}

          <label className="inspect-control">
            <input
              type="checkbox"
              checked={inspect}
              onChange={event => setInspect(event.target.checked)}
            />
            Inspect
          </label>
          {data && (
            <label
              className="prefetch-control"
              title="Start MF client data loading before rendering. SSR data is already loaded on the server."
            >
              <input
                type="checkbox"
                checked={prefetch}
                onChange={event => {
                  setPrefetch(event.target.checked);
                  setRun(value => value + 1);
                }}
              />
              Data prefetch
            </label>
          )}
          <label>
            Simulate slow startup{' '}
            <select
              aria-label="JavaScript startup delay"
              title="Delay the weather entry script to compare the initial page before JavaScript starts"
              value={delay}
              onChange={event => {
                setDelay(Number(event.target.value));
                setRun(value => value + 1);
              }}
            >
              <option value={0}>No delay</option>
              <option value={1500}>1.5 s delay</option>
              <option value={3000}>3 s delay</option>
            </select>
          </label>
          <button onClick={() => setRun(run + 1)}>↻ Reload</button>
        </div>
      </header>
      <div className={`comparison-grid ${data ? 'four-panels' : ''}`}>
        {panels.map(([name, query]) => (
          <Panel
            key={name}
            name={name}
            query={`${query}&failure=${failureEnabled ? failure : ''}&target=${data ? 'provider/Weather' : target}&delay=${delay}${data ? `&compact=1&prefetch=${prefetch ? '1' : '0'}` : ''}`}
            run={run}
            inspect={inspect}
            paletteSeed={paletteSeed}
          />
        ))}
      </div>
    </div>
  );
}
