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
    <nav className="weather-nav" aria-label="对比实验">
      <Link className="weather-brand" to="/compare">
        ◈ 天气实验室 <small>Modern.js × Module Federation</small>
      </Link>
      <div>
        <Link to="/compare">渲染对比</Link>
        <Link to="/compare-data">数据对比</Link>
        <Link to="/advanced">进阶场景</Link>
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
          '客户端已接管',
          '天气数据已显示',
          '交互已验证',
          '数据请求失败',
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
      <header>
        <h2>{name}</h2>
        <span>
          {events['交互已验证'] !== undefined
            ? '● 交互已验证'
            : events['客户端已接管'] !== undefined
              ? '● 客户端已接管'
              : '◌ 等待客户端'}
        </span>
      </header>
      <iframe
        key={run}
        ref={frame}
        title={name}
        onLoad={sendInspect}
        src={`/weather?${query}&run=${run}`}
        sandbox="allow-scripts allow-same-origin"
      />
      <footer>
        {['客户端已接管', '天气数据已显示', '交互已验证'].map(event => (
          <span key={event}>
            {event}
            <b>{events[event] === undefined ? '—' : `${events[event]} ms`}</b>
          </span>
        ))}
      </footer>
    </section>
  );
}
export default function Comparison({ data = false }: { data?: boolean }) {
  const [run, setRun] = useState(0);
  const [delay, setDelay] = useState(1500);
  const [inspect, setInspect] = useState(false);
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
      <header className="comparison-toolbar" aria-label="对比控制">
        <div className="comparison-controls">
          <label className="inspect-control">
            <input
              type="checkbox"
              checked={inspect}
              onChange={event => setInspect(event.target.checked)}
            />
            Inspect
          </label>
          <label>
            模拟慢启动{' '}
            <select
              aria-label="JavaScript 启动延迟"
              title="推迟天气页面入口脚本的加载，用于观察 JavaScript 启动前的页面"
              value={delay}
              onChange={event => {
                setDelay(Number(event.target.value));
                setRun(value => value + 1);
              }}
            >
              <option value={0}>不延迟</option>
              <option value={1500}>延迟 1.5 秒</option>
              <option value={3000}>延迟 3 秒</option>
            </select>
          </label>
          <button onClick={() => setRun(run + 1)}>↻ 重新加载</button>
        </div>
      </header>
      <div className={`comparison-grid ${data ? 'four-panels' : ''}`}>
        {panels.map(([name, query]) => (
          <Panel
            key={name}
            name={name}
            query={`${query}&delay=${delay}${data ? '&compact=1' : ''}`}
            run={run}
            inspect={inspect}
            paletteSeed={paletteSeed}
          />
        ))}
      </div>
    </div>
  );
}
