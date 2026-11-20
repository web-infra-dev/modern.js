import { Select, SelectItem, Button } from './ui/controls';
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
        { label: 'Hot updates', href: '/?lab=ssr&tab=hmr', active: !cache },
        { label: 'Cache & memory', href: '/?lab=ssr&tab=cache', active: cache },
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
                setSourceMessage('');
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
          <div className="lab-control-row" aria-label="Producer source">
            <span>Edit source</span>
            {sources.map(source => {
              // Rsbuild resolves this path from the Host process's cwd.
              const href =
                process.env.NODE_ENV === 'development'
                  ? `/__open-in-editor?file=${encodeURIComponent(`../${source.file}`)}`
                  : `vscode://file${process.env.MF_LAB_SOURCE_ROOT?.replace(/\/$/, '')}/${source.file}`;
              return (
                <a
                  key={source.file}
                  href={href}
                  title={source.file}
                  className="lab-source-link"
                  onClick={async event => {
                    if (process.env.NODE_ENV !== 'development') return;
                    event.preventDefault();
                    setSourceMessage('');
                    try {
                      const response = await fetch(href);
                      if (!response.ok) throw Error(`HTTP ${response.status}`);
                      setSourceMessage(`Requested editor for ${source.file}`);
                    } catch {
                      setSourceMessage(
                        `Open this file in your editor: ${source.file}`,
                      );
                    }
                  }}
                >
                  <LabIcon name="code" />
                  {source.file}
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
