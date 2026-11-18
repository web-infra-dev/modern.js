import { Select, SelectItem } from '../../components/ui/controls';
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
          href: '/service/forecast/today?lab=service&tab=hmr',
          active: tab === 'hmr',
        },
        {
          label: 'Versions & memory',
          href: '/service/forecast/today?lab=service&tab=cache',
          active: tab === 'cache',
        },
      ]}
    >
      {tab !== 'load' && (
        <LabEnvironments path="/service/forecast/today?lab=service&tab=cache" />
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
                      if (value)
                        next.set('remote', value);
                      else next.delete('remote');
                      setParams(next);
                    }}
                  >
                    <SelectItem value="">Service root</SelectItem>
                    {process.env.MF_LAB_SERVICE_NESTED && (
                      <>
                        <SelectItem value="plain">Plain SSR dependency</SelectItem>
                        <SelectItem value="nested">Nested SSR dependency</SelectItem>
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
