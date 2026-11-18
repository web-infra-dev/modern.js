import { useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout, LabEnvironments } from './LabLayout';
import { LabPanel } from './LabPanel';
import { LabChain } from './LabChain';
import { LabIcon } from './LabIcon';
import { ProducerUpdateControls } from './ProducerUpdateControls';

export function SSRWorkbench() {
  const [params] = useSearchParams();
  const cache = params.get('tab') === 'cache';
  const partial = process.env.MF_LAB_SSR_SCOPE === 'entries';
  const [scenario, setScenario] = useState(
    params.get('scenario') === 'bridge'
      ? 'bridge'
      : params.get('scenario') === 'nested'
        ? 'nested'
        : 'ordinary',
  );
  const [run, setRun] = useState(0);
  const [sourceMessage, setSourceMessage] = useState('');
  const bridge = scenario === 'bridge';
  const nested = scenario === 'nested';
  const sources = bridge
    ? [
        {
          label: '应用标题',
          file: 'provider/src/routes/weather-application/layout.tsx:67',
        },
      ]
    : nested
      ? [
          { label: '中间层入口', file: 'nested/src/WeatherWind.tsx:3' },
          { label: 'Rslib 风力文案', file: 'library/src/WeatherWind.tsx:10' },
        ]
      : [{ label: '天气标题', file: 'provider/src/weather-ui.tsx:112' }];
  const query = new URLSearchParams({
    render: 'ssr',
    data: 'local',
    target: nested ? 'nested/WeatherWind' : 'provider/Weather',
    labFrame: '1',
  });
  if (!bridge && !partial && (nested || !cache))
    query.set('focus', nested ? 'nested' : 'current');
  if (partial) query.set('static', '1');
  return (
    <LabLayout
      section="ssr"
      title="SSR 更新"
      description="沿同一条依赖链，观察开发热更、服务端缓存更新和版本切换后的内存。"
      tabs={[
        { label: '热更新', href: '/?lab=ssr&tab=hmr', active: !cache },
        { label: '缓存与内存', href: '/?lab=ssr&tab=cache', active: cache },
      ]}
    >
      <LabEnvironments partial={partial} />
      <section className="lab-controls">
        <div className="lab-control-row">
          <label>
            测试场景{' '}
            <select
              data-testid="ssr-scenario"
              value={scenario}
              onChange={event => {
                setScenario(event.target.value);
                setSourceMessage('');
                const next = new URLSearchParams(params);
                next.set('scenario', event.target.value);
                history.replaceState(
                  history.state,
                  '',
                  `${location.pathname}?${next}`,
                );
              }}
            >
              <option value="ordinary">普通 SSR 组件</option>
              {!partial && (
                <>
                  <option value="nested">嵌套 SSR</option>
                  <option value="bridge">Bridge SSR 应用</option>
                </>
              )}
            </select>
          </label>
          <LabChain nested={nested} />
          <button
            className="lab-icon-button"
            title="重新请求 SSR"
            aria-label="重新请求 SSR"
            onClick={() => setRun(value => value + 1)}
          >
            <LabIcon name="refresh" /> SSR
          </button>
        </div>
        {!cache && process.env.NODE_ENV === 'development' && (
          <div className="lab-control-row" aria-label="生产者源码">
            <span>打开源码</span>
            {sources.map(source => {
              // Rsbuild resolves this path from the Host process's cwd.
              const href = `/__open-in-editor?file=${encodeURIComponent(`../${source.file}`)}`;
              return (
                <a
                  key={source.file}
                  href={href}
                  title={source.file}
                  className="lab-source-link"
                  onClick={async event => {
                    event.preventDefault();
                    setSourceMessage('');
                    try {
                      const response = await fetch(href);
                      if (!response.ok) throw Error(`HTTP ${response.status}`);
                      setSourceMessage(`已请求编辑器打开 ${source.file}`);
                    } catch {
                      setSourceMessage(
                        `打开失败，请在编辑器中打开 ${source.file}`,
                      );
                    }
                  }}
                >
                  <LabIcon name="code" />
                  {source.label}
                </a>
              );
            })}
            {sourceMessage && <small role="status">{sourceMessage}</small>}
          </div>
        )}
      </section>
      {cache && (
        <ProducerUpdateControls
          key={scenario}
          scenario={bridge ? 'bridge' : 'ordinary'}
          onUpdate={() => setRun(value => value + 1)}
          verifyURL={
            bridge
              ? '/bridge-ssr/forecast/today?labFrame=1'
              : `/weather?${query}`
          }
        />
      )}
      <div className="lab-single-preview">
        <LabPanel
          name={bridge ? 'Bridge SSR' : 'SSR'}
          path={bridge ? '/bridge-ssr/forecast/today' : '/weather'}
          query={query.toString()}
          run={run}
          refresh={0}
          inspect={false}
          paletteSeed=""
        />
      </div>
    </LabLayout>
  );
}
