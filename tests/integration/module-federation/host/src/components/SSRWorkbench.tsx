import { Select, SelectItem, Button } from './ui/controls';
import { useEffect, useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout, LabEnvironments } from './LabLayout';
import { LabPanel } from './LabPanel';
import { LabChain } from './LabChain';
import { LabIcon } from './LabIcon';
import { ProducerSourceLinks } from './ProducerSourceLinks';
import { ProducerUpdateControls } from './ProducerUpdateControls';

type DevEntryState = {
  pid: number;
  configuredScope: string;
  entries: { entry: string; runtime: number; modules: (number | null)[] }[];
};

export function SSRWorkbench() {
  const [params] = useSearchParams();
  const cache = params.get('tab') === 'cache';
  const isProd = process.env.NODE_ENV === 'production';
  const partial = process.env.MF_LAB_SSR_SCOPE === 'entries';
  const [scenario, setScenario] = useState(
    params.get('scenario') === 'bridge'
      ? 'bridge'
      : params.get('scenario') === 'nested'
        ? 'nested'
        : 'ordinary',
  );
  const [run, setRun] = useState(0);
  const [devState, setDevState] = useState<DevEntryState>();
  useEffect(() => {
    if (cache || isProd || !process.env.MF_LAB_UPDATES) return;
    let active = true;
    void fetch('/_lab/update/lab/status')
      .then(response => (response.ok ? response.json() : undefined))
      .then(data => {
        if (active && data?.entries) setDevState(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cache, isProd, run, scenario]);
  const bridge = scenario === 'bridge';
  const nested = scenario === 'nested';
  const devOrigin =
    (partial && process.env.MF_LAB_DEV_PARTIAL_ORIGIN) ||
    process.env.MF_LAB_DEV_ORIGIN;
  const buildOrigin =
    (partial && process.env.MF_LAB_PARTIAL_ORIGIN) ||
    process.env.MF_LAB_UPDATE_ORIGIN;
  const hmrHref =
    isProd && devOrigin ? `${devOrigin}/?lab=ssr&tab=hmr` : '/?lab=ssr&tab=hmr';
  const cacheHref =
    !isProd && buildOrigin
      ? `${buildOrigin}/?lab=ssr&tab=cache`
      : '/?lab=ssr&tab=cache';
  const sources = bridge
    ? [
        {
          label: 'Application title',
          file: 'provider/src/routes/weather-application/layout.tsx:67',
        },
      ]
    : nested
      ? [
          { label: 'Intermediate entry', file: 'nested/src/WeatherWind.tsx:3' },
          {
            label: 'Rslib wind component',
            file: 'library/src/WeatherWind.tsx:10',
          },
        ]
      : [{ label: 'Weather heading', file: 'provider/src/weather-ui.tsx:112' }];
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
      title="SSR updates"
      description="Observe HMR, cache updates and memory across versions."
      tabs={[
        { label: 'Hot updates', href: hmrHref, active: !cache },
        { label: 'Cache & memory', href: cacheHref, active: cache },
      ]}
    >
      <LabEnvironments partial={partial} />
      <section className="lab-controls">
        <div className="lab-control-row">
          <label>
            Scenario{' '}
            <Select
              aria-label="Scenario"
              data-testid="ssr-scenario"
              value={scenario}
              onValueChange={value => {
                setScenario(value);
                const next = new URLSearchParams(params);
                next.set('scenario', value);
                history.replaceState(
                  history.state,
                  '',
                  `${location.pathname}?${next}`,
                );
              }}
            >
              <SelectItem value="ordinary">SSR component</SelectItem>
              {!partial && (
                <>
                  <SelectItem value="nested">Nested SSR</SelectItem>
                  <SelectItem value="bridge">Bridge SSR app</SelectItem>
                </>
              )}
            </Select>
          </label>
          <span title="Dependency chain">
            <LabChain nested={nested} />
          </span>
          <Button
            className="lab-icon-button"
            title="Request SSR"
            aria-label="Request SSR"
            onClick={() => setRun(value => value + 1)}
          >
            <LabIcon name="refresh" /> SSR
          </Button>
        </div>
        {!cache && (
          <ProducerSourceLinks sources={sources} resetKey={scenario} />
        )}
        {!cache && devState && (
          <div className="lab-control-row" aria-label="SSR entry status">
            <span>
              PID {devState.pid} · scope:{' '}
              <strong>{devState.configuredScope}</strong>
            </span>
            {devState.entries.map(item => (
              <span key={item.entry}>
                <code>{item.entry}</code> runtime #{item.runtime}
              </span>
            ))}
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
