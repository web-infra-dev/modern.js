import { Select, SelectItem, Checkbox, Button } from './ui/controls';
import { useState, type CSSProperties } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import {
  FailureControls,
  renderFailures,
  dataFailures,
} from '../failure/Controls';
import { LabLayout } from './LabLayout';
import { LabPanel } from './LabPanel';
import { LabIcon } from './LabIcon';
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
  const [fit, setFit] = useState(true);
  const [seed] = useState(paletteSeed);
  const edit = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => setDraft(previous => ({ ...previous, [key]: value }));
  const changed = JSON.stringify(draft) !== JSON.stringify(applied);
  const modeCount = applied.modes.length;
  function applyConfiguration(nextConfig = draft) {
    setApplied(nextConfig);
    setRun(value => value + 1);
    const next = new URLSearchParams(params);
    next.set('modes', nextConfig.modes.join(','));
    next.set('fetch', nextConfig.data ? '1' : '0');
    next.set('preload', nextConfig.prefetch ? '1' : '0');
    next.set('delay', String(nextConfig.delay));
    if (nextConfig.failureEnabled) next.set('failure', nextConfig.failure);
    else next.delete('failure');
    next.set('target', nextConfig.target);
    history.replaceState(history.state, '', `${location.pathname}?${next}`);
  }
  return (
    <LabLayout
      section="render"
      className={`lab-render-layout ${fit ? 'lab-fit-layout' : ''}`}
      title="Rendering"
      description="Compare loading and interaction timing."
    >
      <section className="lab-controls" aria-label="Rendering settings">
        <div className="lab-control-row">
          <fieldset>
            <legend>Render modes</legend>
            {available.map(mode => (
              <label key={mode}>
                <Checkbox
                  data-testid={`mode-${mode}`}
                  checked={draft.modes.includes(mode)}
                  onCheckedChange={checked =>
                    edit(
                      'modes',
                      checked
                        ? [...draft.modes, mode]
                        : draft.modes.filter(item => item !== mode),
                    )
                  }
                />
                {labels[mode]}
              </label>
            ))}
          </fieldset>
          <div className="lab-render-display">
            <label
              className="inspect-control"
              aria-label="Inspect"
              title="Show debug markers"
            >
              <Checkbox
                aria-label="Inspect"
                checked={inspect}
                onCheckedChange={checked => setInspect(checked)}
              />
              <LabIcon name="inspect" />
            </label>
            <Button onClick={() => setFit(value => !value)}>
              {fit ? 'Full-size view' : 'Fit to screen'}
            </Button>
          </div>
        </div>
        <div className="lab-control-row">
          <label>
            <Checkbox
              data-testid="compare-data"
              checked={draft.data}
              onCheckedChange={checked => edit('data', checked)}
            />
            Data fetching
          </label>
          <label className="prefetch-control">
            <Checkbox
              checked={draft.prefetch}
              onCheckedChange={checked => edit('prefetch', checked)}
            />
            Prefetch
          </label>
          <Button
            className="lab-primary"
            data-testid="render-apply"
            disabled={!draft.modes.length}
            onClick={() => applyConfiguration()}
          >
            <LabIcon name="refresh" /> Apply
          </Button>
          {changed && <small role="status">Changes pending</small>}
          {applied.failureEnabled && (
            <Button
              data-testid="clear-failure"
              onClick={() => {
                const clean = { ...draft, failureEnabled: false };
                setDraft(clean);
                applyConfiguration(clean);
              }}
            >
              <LabIcon name="refresh" /> Reset
            </Button>
          )}
          <details className="lab-advanced">
            <summary>Advanced</summary>
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
              <label>
                Failure target{' '}
                <Select
                  aria-label="Failure target"
                  value={draft.target}
                  onValueChange={value => edit('target', value)}
                >
                  <SelectItem value="provider/Weather">
                    Current weather
                  </SelectItem>
                  <SelectItem value="dynamic/WeatherHourly">
                    Dynamic hourly forecast
                  </SelectItem>
                  <SelectItem value="nested/WeatherDays">
                    Nested daily forecast
                  </SelectItem>
                  <SelectItem value="nested/WeatherWind">
                    Dynamic nested wind
                  </SelectItem>
                </Select>
              </label>
              <label>
                Script delay{' '}
                <Select
                  aria-label="JavaScript startup delay"
                  value={draft.delay}
                  onValueChange={value => edit('delay', Number(value))}
                >
                  <SelectItem value="0">No delay</SelectItem>
                  <SelectItem value="1500">1.5 s</SelectItem>
                  <SelectItem value="3000">3 s</SelectItem>
                </Select>
              </label>
            </div>
          </details>
        </div>
      </section>
      {!modeCount && (
        <p className="lab-empty">Select at least one rendering mode.</p>
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
              : [
                  { label: labels[mode], data: 'local', prefetch: false },
                  ...(!ordinary && applied.data
                    ? [
                        {
                          label: `${labels[mode]} + data loader`,
                          data: 'loader',
                          prefetch: false,
                        },
                      ]
                    : []),
                  ...(!ordinary && applied.prefetch
                    ? [
                        {
                          label: `${labels[mode]} + Asset prefetch`,
                          data: applied.data ? 'loader' : 'local',
                          prefetch: true,
                        },
                      ]
                    : []),
                ];
          return (
            <section
              className={`lab-render-group ${variants.length > 1 ? 'has-variants' : ''}`}
              key={mode}
              data-render-mode={mode}
            >
              <h2>
                {labels[mode]}
                {mode === 'ssr' && applied.prefetch
                  ? ' · SSR supplies initial data; browser prefetch is skipped'
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
                    failure:
                      ordinary && applied.failureEnabled ? applied.failure : '',
                    target: applied.target,
                    delay: String(applied.delay),
                  });
                  if (mode === 'csr') query.set('csr', '1');
                  if (partial) query.set('static', '1');
                  if (!ordinary) {
                    query.set('labFrame', '1');
                    query.set('labData', variant.data);
                  }
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
                      fit={fit}
                      description={
                        !ordinary
                          ? variant.data === 'local'
                            ? 'Local data'
                            : 'App loader'
                          : undefined
                      }
                      preloadApplication={
                        !ordinary && variant.prefetch ? mode : undefined
                      }
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
