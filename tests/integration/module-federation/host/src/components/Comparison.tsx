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
      <Link className="weather-brand" to="/compare">
        ◈ Weather Lab
      </Link>
      <div>
        <Link to="/compare">Rendering</Link>
        <Link to="/compare-data">Data fetching</Link>
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
      { type: 'mf-lab-inspect', enabled: inspectRef.current, paletteSeed },
      window.location.origin,
    );
  }, [paletteSeed]);
  useEffect(sendInspect, [inspect, run, sendInspect]);
  const [events, setEvents] = useState<Record<string, number>>({});
  useEffect(() => {
    setEvents({});
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data?.type === 'mf-lab-inspect-ready') {
        sendInspect();
        return;
      }
      if (event.data?.type !== 'mf-weather') return;
      if (
        ![
          'Client ready',
          'Weather ready',
          'Interaction verified',
          'Data request failed',
          'Data prefetch started',
        ].includes(event.data.event) ||
        typeof event.data.at !== 'number'
      )
        return;
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
        <h2>{name}</h2>
        <span>
          {events['Interaction verified'] !== undefined
            ? '● Interaction verified'
            : events['Client ready'] !== undefined
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
        {['Client ready', 'Weather ready', 'Interaction verified'].map(
          event => (
            <span key={event}>
              {event}
              <b>{events[event] === undefined ? '—' : `${events[event]} ms`}</b>
            </span>
          ),
        )}
      </footer>
    </section>
  );
}
export default function Comparison({ data = false }: { data?: boolean }) {
  const [run, setRun] = useState(0);
  const [delay, setDelay] = useState(0);
  const [inspect, setInspect] = useState(false);
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
            query={`${query}&delay=${delay}${data ? `&compact=1&prefetch=${prefetch ? '1' : '0'}` : ''}`}
            run={run}
            inspect={inspect}
            paletteSeed={paletteSeed}
          />
        ))}
      </div>
    </div>
  );
}
