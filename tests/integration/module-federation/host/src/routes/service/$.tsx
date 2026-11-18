import { ProducerUpdateControls } from '../../components/ProducerUpdateControls';
import { ServiceMount } from '../../components/ServiceMount';
import { useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout, LabEnvironments } from '../../components/LabLayout';
import { LabPanel } from '../../components/LabPanel';

export default function ServiceWeather() {
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState(0);
  const tab = params.get('tab') || (params.has('late') ? 'load' : 'hmr');
  if (params.has('labFrame')) return <ServiceMount />;
  const comparison = params.get('lab') === 'service' && tab === 'load';
  return (
    <LabLayout
      section="service"
      title="Service 应用"
      description="对照加载方式，追踪 Service 内部 SSR 依赖，并同时观察 Host 与生产者内存。"
      tabs={[
        {
          label: '加载对比',
          href: '/service/forecast/today?lab=service&tab=load',
          active: tab === 'load',
        },
        {
          label: '热更新与 SSR 依赖',
          href: '/service/forecast/today?lab=service&tab=hmr',
          active: tab === 'hmr',
        },
        {
          label: '版本与内存',
          href: '/service/forecast/today?lab=service&tab=cache',
          active: tab === 'cache',
        },
      ]}
    >
      {tab !== 'load' && (
        <LabEnvironments path="/service/forecast/today?lab=service&tab=cache" />
      )}
      {comparison ? (
        <>
          <section className="lab-controls">
            <div className="lab-control-row">
              <span>同一应用 · 同一数据 · 独立挂载</span>
              <button
                className="lab-primary"
                onClick={() => setRun(value => value + 1)}
              >
                刷新两侧对照
              </button>
            </div>
            <p className="lab-note">
              左侧从页面导航起算，右侧从“连接 Service
              App”点击起算。首屏加载与按需加载的起点不同，不直接按数值排名。
            </p>
          </section>
          <div className="lab-render-grid">
            {[false, true].map(late => (
              <LabPanel
                key={String(late)}
                name={late ? '点击后加载 · 点击起算' : '首屏加载 · 导航起算'}
                path="/service/forecast/today"
                query={`labFrame=1${late ? '&late=1' : ''}`}
                run={run}
                refresh={0}
                inspect={false}
                paletteSeed=""
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {tab === 'hmr' && (
            <section className="lab-controls">
              <div className="lab-control-row">
                <label>
                  SSR 依赖{' '}
                  <select
                    aria-label="Service SSR dependency"
                    value={params.get('remote') || ''}
                    onChange={event => {
                      const next = new URLSearchParams(params);
                      if (event.target.value)
                        next.set('remote', event.target.value);
                      else next.delete('remote');
                      setParams(next);
                    }}
                  >
                    <option value="">Service 自身</option>
                    {process.env.MF_LAB_SERVICE_NESTED && (
                      <>
                        <option value="plain">内部普通 SSR</option>
                        <option value="nested">内部嵌套 SSR</option>
                      </>
                    )}
                  </select>
                </label>
                <span>
                  {params.get('remote') === 'nested'
                    ? 'Host → Service → Modern → Rslib'
                    : params.has('remote')
                      ? 'Host → Service → Rslib'
                      : 'Host → Service'}
                </span>
              </div>
              <p className="lab-note">
                修改对应生产者源码观察热更新；主动刷新检查 Node SSR 的新结果。
              </p>
            </section>
          )}
          {(tab === 'cache' || (!params.has('lab') && !params.has('late'))) && (
            <ProducerUpdateControls
              scenario="service"
              onUpdate={
                params.has('lab') ? () => setRun(value => value + 1) : undefined
              }
              verifyURL="/service/forecast/today?labFrame=1"
            />
          )}
          <ServiceMount key={run} />
        </>
      )}
    </LabLayout>
  );
}
