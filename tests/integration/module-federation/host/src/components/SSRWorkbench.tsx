import { useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout, LabEnvironments } from './LabLayout';
import { LabPanel } from './LabPanel';
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
  const bridge = scenario === 'bridge';
  const nested = scenario === 'nested';
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
          <span className="lab-note">
            {nested
              ? 'Host → Modern → Rslib'
              : bridge
                ? 'Host → Bridge application'
                : 'Host → Weather component'}
          </span>
          <button onClick={() => setRun(value => value + 1)}>
            重新请求 SSR
          </button>
        </div>
        <p className="lab-note">
          {cache
            ? '在同一轮实验中切换版本、观察更新期间请求，再执行 GC 对比内存。局部更新需要进入静态配置，以实际 mode / entries 判断结果。'
            : '编辑生产者源码观察浏览器 HMR。Node 准备完成不触发额外刷新；点击重新请求 SSR，观察最新首屏。'}
        </p>
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
