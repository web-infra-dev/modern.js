import { useEffect, useRef, useState } from 'react';
import { Link } from '@modern-js/runtime/router';
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
  scripts,
  run,
}: {
  name: string;
  query: string;
  scripts: boolean;
  run: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [events, setEvents] = useState<Record<string, number>>({});
  useEffect(() => {
    setEvents({});
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== 'mf-weather'
      )
        return;
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
  }, [run, scripts]);
  return (
    <section className="comparison-panel">
      <header>
        <h2>{name}</h2>
        <span>
          {scripts
            ? events['交互已验证'] !== undefined
              ? '● 交互已验证'
              : events['客户端已接管'] !== undefined
                ? '● 客户端已接管'
                : '◌ 等待客户端'
            : '脚本已暂停 · 检查首屏 HTML'}
        </span>
      </header>
      <iframe
        key={`${run}-${scripts}`}
        ref={frame}
        title={name}
        src={`/weather?${query}&run=${run}`}
        sandbox={
          scripts ? 'allow-scripts allow-same-origin' : 'allow-same-origin'
        }
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
  const [scripts, setScripts] = useState(true);
  const [run, setRun] = useState(0);
  const [delay, setDelay] = useState(1500);
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
      <header className="comparison-intro">
        <div>
          <span>WEATHER / FEDERATION LAB</span>
          <h1>
            {data ? '同一份天气，四条数据路径。' : '同一片天空，两种渲染方式。'}
          </h1>
          <p>
            {data
              ? '本地 API 固定延迟 900 ms。普通模式挂载后请求；data-fetch 使用 MF 数据加载器。'
              : '相同预置天气，不等待接口。暂停脚本，查看服务端交付的内容；开启脚本，再亲手验证交互。'}
          </p>
        </div>
        <div className="comparison-controls">
          <label>
            启动脚本延迟{' '}
            <select
              aria-label="客户端启动脚本延迟"
              value={delay}
              onChange={event => {
                setDelay(Number(event.target.value));
                setRun(value => value + 1);
              }}
            >
              <option value={0}>0 ms</option>
              <option value={1500}>1500 ms</option>
              <option value={3000}>3000 ms</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={scripts}
              onChange={event => setScripts(event.target.checked)}
            />{' '}
            执行客户端脚本
          </label>
          <button onClick={() => setRun(run + 1)}>↻ 同时重新加载</button>
        </div>
      </header>
      <div className={`comparison-grid ${data ? 'four-panels' : ''}`}>
        {panels.map(([name, query]) => (
          <Panel
            key={name}
            name={name}
            query={`${query}&delay=${delay}${data ? '&compact=1' : ''}`}
            scripts={scripts}
            run={run}
          />
        ))}
      </div>
      <footer className="comparison-note">
        时间取自各 iframe 的
        performance.now()，包含文档请求和资源加载；数据就绪由客户端确认；暂停脚本可检查
        SSR 首屏内容。所有接口与素材均在本地。
      </footer>
    </div>
  );
}
