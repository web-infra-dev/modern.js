import { Select, SelectItem } from '../../components/ui/controls';
import { ProducerSourceLinks } from '../../components/ProducerSourceLinks';
import { ProducerUpdateControls } from '../../components/ProducerUpdateControls';
import { ServiceMount } from '../../components/ServiceMount';
import { useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { LabLayout, LabEnvironments } from '../../components/LabLayout';
import { ServiceLoadComparison } from '../../components/ServiceLoadComparison';
import { ClickApplication } from '../../components/ClickApplication';

export default function ServiceWeather() {
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState(0);
  const tab = params.get('tab') || (params.has('late') ? 'load' : 'hmr');
  if (params.get('bench') === 'service')
    return <ClickApplication kind="service" />;
  if (params.has('labFrame')) return <ServiceMount />;
  const comparison = params.get('lab') === 'service' && tab === 'load';
  const isProd = process.env.NODE_ENV === 'production';
  const devOrigin = process.env.MF_LAB_DEV_ORIGIN;
  const buildOrigin = process.env.MF_LAB_UPDATE_ORIGIN;
  const hmrHref =
    isProd && devOrigin
      ? `${devOrigin}/service/forecast/today?lab=service&tab=hmr`
      : '/service/forecast/today?lab=service&tab=hmr';
  const cacheHref =
    !isProd && buildOrigin
      ? `${buildOrigin}/service/forecast/today?lab=service&tab=cache`
      : '/service/forecast/today?lab=service&tab=cache';
  const remote = params.get('remote') || '';
  const sources = [
    {
      label: 'Service title',
      file: 'provider/src/routes/weather-application/layout.tsx:67',
    },
    ...(remote === 'nested'
      ? [{ label: 'Intermediate entry', file: 'nested/src/WeatherWind.tsx:3' }]
      : []),
    ...(remote === 'plain' || remote === 'nested'
      ? [
          {
            label: 'Rslib wind component',
            file: 'library/src/WeatherWind.tsx:10',
          },
        ]
      : []),
  ];
  return (
    <LabLayout
      section="service"
      className={comparison ? 'lab-render-layout lab-fit-layout' : undefined}
      title="Service apps"
      description="Compare loading, SSR dependencies and memory."
      tabs={[
        {
          label: 'Loading',
          href: '/service/forecast/today?lab=service&tab=load',
          active: tab === 'load',
        },
        {
          label: 'HMR & SSR dependencies',
          href: hmrHref,
          active: tab === 'hmr',
        },
        {
          label: 'Versions & memory',
          href: cacheHref,
          active: tab === 'cache',
        },
      ]}
    >
      {tab !== 'load' && (
        <LabEnvironments
          path="/service/forecast/today?lab=service&tab=cache"
          devPath="/service/forecast/today?lab=service&tab=hmr"
          showPartialSwitch={false}
        />
      )}
      {comparison ? (
        <ServiceLoadComparison />
      ) : (
        <>
          {tab === 'hmr' && (
            <section className="lab-controls">
              <div className="lab-control-row">
                <label>
                  SSR dependency{' '}
                  <Select
                    aria-label="Service SSR dependency"
                    value={params.get('remote') || ''}
                    onValueChange={value => {
                      const next = new URLSearchParams(params);
                      if (value) next.set('remote', value);
                      else next.delete('remote');
                      setParams(next);
                    }}
                  >
                    <SelectItem value="">Service root</SelectItem>
                    {process.env.MF_LAB_SERVICE_NESTED && (
                      <>
                        <SelectItem value="plain">
                          Plain SSR dependency
                        </SelectItem>
                        <SelectItem value="nested">
                          Nested SSR dependency
                        </SelectItem>
                      </>
                    )}
                  </Select>
                </label>
                <span>
                  {params.get('remote') === 'nested'
                    ? 'Host → Service → Modern → Rslib'
                    : params.has('remote')
                      ? 'Host → Service → Rslib'
                      : 'Host → Service'}
                </span>
              </div>
              <ProducerSourceLinks sources={sources} resetKey={remote} />
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
