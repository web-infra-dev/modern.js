import { useState, type CSSProperties } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import {
  FailureControls,
  renderFailures,
  dataFailures,
} from '../failure/Controls';
import { LabLayout } from './LabLayout';
import { LabPanel } from './LabPanel';
import { SSRWorkbench } from './SSRWorkbench';
import '../weather-base.css';
import '../../../provider/src/weather-scene.css';
import '../weather.css';
export { LegacyLabNav as LabNav } from './LabLayout';

type Mode = 'csr' | 'ssr' | 'bridge' | 'service';
const labels: Record<Mode, string> = {
  csr: 'CSR',
  ssr: 'SSR',
  bridge: 'Bridge SSR',
  service: 'Service App',
};
function paletteSeed() {
  if (typeof window === 'undefined') return '';
  const key = 'mf-lab.inspect-palette';
  try {
    const previous = sessionStorage.getItem(key);
    if (previous) return previous;
    const value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return crypto.randomUUID();
  }
}
export default function Comparison({ data = false }: { data?: boolean }) {
  const [params] = useSearchParams();
  if (params.get('lab') === 'ssr') return <SSRWorkbench />;
  return <RenderingComparison data={data} />;
}
function RenderingComparison({ data }: { data: boolean }) {
  const [params] = useSearchParams();
  const partial = process.env.MF_LAB_SSR_SCOPE === 'entries';
  const available: Mode[] = partial
    ? ['csr', 'ssr']
    : process.env.MF_LAB_SERVICE
      ? ['csr', 'ssr', 'bridge', 'service']
      : ['csr', 'ssr', 'bridge'];
  const configured = params
    .get('modes')
    ?.split(',')
    .filter((mode): mode is Mode => available.includes(mode as Mode));
  const initial = {
    modes: configured?.length
      ? configured
      : data
        ? (['csr', 'ssr'] as Mode[])
        : available,
    data: data || params.get('fetch') === '1',
    prefetch: params.get('preload') === '1',
    delay: [1500, 3000].includes(Number(params.get('delay')))
      ? Number(params.get('delay'))
      : 0,
    failureEnabled: params.has('failure'),
    failure: params.get('failure') || 'network',
    target: params.get('target') || 'provider/Weather',
  };
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [run, setRun] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [seed] = useState(paletteSeed);
  const edit = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => setDraft(previous => ({ ...previous, [key]: value }));
  const changed = JSON.stringify(draft) !== JSON.stringify(applied);
  const modeCount = applied.modes.length;
  return (
    <LabLayout
      section="render"
      title="渲染对比"
      description="在独立页面中对照加载、首屏内容与可交互时间。配置先暂存，应用后统一刷新。"
    >
      <section className="lab-controls" aria-label="渲染配置">
        <div className="lab-control-row">
          <fieldset>
            <legend>渲染方式</legend>
            {available.map(mode => (
              <label key={mode}>
                <input
                  type="checkbox"
                  data-testid={`mode-${mode}`}
                  checked={draft.modes.includes(mode)}
                  onChange={event =>
                    edit(
                      'modes',
                      event.target.checked
                        ? [...draft.modes, mode]
                        : draft.modes.filter(item => item !== mode),
                    )
                  }
                />
                {labels[mode]}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="lab-control-row">
          <label>
            <input
              data-testid="compare-data"
              type="checkbox"
              checked={draft.data}
              onChange={event => edit('data', event.target.checked)}
            />
            数据获取对照
          </label>
          <label className="prefetch-control">
            <input
              type="checkbox"
              checked={draft.prefetch}
              onChange={event => edit('prefetch', event.target.checked)}
            />
            预加载对照
          </label>
          <label className="inspect-control">
            <input
              type="checkbox"
              checked={inspect}
              onChange={event => setInspect(event.target.checked)}
            />
            Inspect
          </label>
          <button
            className="lab-primary"
            data-testid="render-apply"
            disabled={!draft.modes.length}
            onClick={() => {
              setApplied(draft);
              setRun(value => value + 1);
              const next = new URLSearchParams(params);
              next.set('modes', draft.modes.join(','));
              next.set('fetch', draft.data ? '1' : '0');
              next.set('preload', draft.prefetch ? '1' : '0');
              next.set('delay', String(draft.delay));
              if (draft.failureEnabled) next.set('failure', draft.failure);
              else next.delete('failure');
              next.set('target', draft.target);
              history.replaceState(
                history.state,
                '',
                `${location.pathname}?${next}`,
              );
            }}
          >
            应用并刷新
          </button>
          {changed && <small role="status">有未应用的配置</small>}
          <details className="lab-advanced">
            <summary>高级设置</summary>
            <div className="comparison-controls">
              <FailureControls
                enabled={draft.failureEnabled}
                kind={draft.failure}
                options={[...renderFailures, ...dataFailures]}
                onChange={(enabled, kind) =>
                  setDraft(value => ({
                    ...value,
                    failureEnabled: enabled,
                    failure: kind,
                  }))
                }
              />
              <select
                aria-label="Failure target"
                value={draft.target}
                onChange={event => edit('target', event.target.value)}
              >
                <option value="provider/Weather">Current weather</option>
                <option value="dynamic/WeatherHourly">
                  Dynamic hourly forecast
                </option>
                <option value="nested/WeatherDays">
                  Nested daily forecast
                </option>
                <option value="nested/WeatherWind">Dynamic nested wind</option>
              </select>
              <label>
                脚本延迟{' '}
                <select
                  aria-label="JavaScript startup delay"
                  value={draft.delay}
                  onChange={event => edit('delay', Number(event.target.value))}
                >
                  <option value="0">无延迟</option>
                  <option value="1500">1.5 s</option>
                  <option value="3000">3 s</option>
                </select>
              </label>
            </div>
          </details>
        </div>
        <p className="lab-note">
          {applied.data || applied.prefetch
            ? '普通组件使用相同天气 API，对照普通请求、MF data-fetch 与提前取数。Bridge / Service 使用各自的应用 loader，不重复套用组件数据协议。'
            : 'CSR / SSR 使用固定数据，观察代码加载与渲染；Bridge / Service 保留真实应用 loader。'}{' '}
          指标从各 iframe 导航起算，并发加载会共享浏览器网络与 HTTP
          缓存，不能直接视为性能排名。
        </p>
      </section>
      {!modeCount && (
        <p className="lab-empty">选择至少一种渲染方式后应用配置。</p>
      )}
      <div className="lab-render-grid" data-testid="render-grid">
        {applied.modes.map(mode => {
          const ordinary = mode === 'csr' || mode === 'ssr';
          const variants =
            ordinary && !partial
              ? [
                  {
                    label: labels[mode],
                    data: applied.data
                      ? 'client'
                      : applied.prefetch
                        ? 'mf'
                        : 'local',
                    prefetch: false,
                  },
                  ...(applied.data
                    ? [
                        {
                          label: `${labels[mode]} + data-fetch`,
                          data: 'mf',
                          prefetch: false,
                        },
                      ]
                    : []),
                  ...(applied.prefetch && mode === 'csr'
                    ? [
                        {
                          label: `${labels[mode]} + prefetch`,
                          data: 'mf',
                          prefetch: true,
                        },
                      ]
                    : []),
                ]
              : [{ label: labels[mode], data: 'local', prefetch: false }];
          return (
            <section
              className={`lab-render-group ${variants.length > 1 ? 'has-variants' : ''}`}
              key={mode}
              data-render-mode={mode}
            >
              <h2>
                {labels[mode]}
                {mode === 'ssr' && applied.prefetch
                  ? ' · 首屏数据由 SSR 提供，浏览器预取不重复执行'
                  : ''}
              </h2>
              <div
                className="lab-render-variants"
                style={{ '--variants': variants.length } as CSSProperties}
              >
                {variants.map(variant => {
                  const query = new URLSearchParams({
                    render: mode,
                    data: variant.data,
                    prefetch: variant.prefetch ? '1' : '0',
                    failure: applied.failureEnabled ? applied.failure : '',
                    target: applied.target,
                    delay: String(applied.delay),
                  });
                  if (mode === 'csr') query.set('csr', '1');
                  if (partial) query.set('static', '1');
                  if (!ordinary) query.set('labFrame', '1');
                  if (applied.data || applied.prefetch)
                    query.set('compact', '1');
                  return (
                    <LabPanel
                      key={variant.label}
                      name={variant.label}
                      path={
                        mode === 'bridge'
                          ? '/bridge-ssr/forecast/today'
                          : mode === 'service'
                            ? '/service/forecast/today'
                            : '/weather'
                      }
                      query={query.toString()}
                      run={run}
                      refresh={0}
                      inspect={inspect}
                      paletteSeed={seed}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </LabLayout>
  );
}
