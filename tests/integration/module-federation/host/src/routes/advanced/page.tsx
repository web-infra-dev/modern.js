import { Select, SelectItem } from '../../components/ui/controls';
import {
  FailureControls,
  renderFailures,
  dataFailures,
} from '../../failure/Controls';
import { useState, useEffect, useRef } from 'react';
import { LabLayout } from '../../components/LabLayout';
export default function Page() {
  const [scenario, setScenario] = useState<
    'recovery' | 'lifecycle' | 'replace' | 'bridge' | 'data'
  >('replace');
  const [failureEnabled, setFailureEnabled] = useState(false);
  const [failure, setFailure] = useState('network');
  const [run, setRun] = useState(0);
  const [recovery, setRecovery] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    setRecovery('');
    const receive = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'mf-lab-recovery' &&
        typeof event.data.status === 'string'
      )
        setRecovery(event.data.status);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [run, scenario]);
  return (
    <LabLayout
      section="render"
      title="Experiments"
      description="Remote replacement, recovery and standalone app experiments."
    >
      <header className="comparison-intro">
        <div>
          <span>WEATHER / ADVANCED</span>
          <h1>
            Weather experiments{' '}
            {recovery && (
              <small className="recovery-badge" role="status">
                {recovery}
              </small>
            )}
          </h1>
          <p>
            Remote replacement, data recovery, loader lifecycle and independent
            weather stations.
          </p>
        </div>
        {scenario !== 'bridge' && (
          <FailureControls
            enabled={failureEnabled}
            kind={failure}
            options={[
              ...renderFailures.filter(
                ([kind]) => scenario === 'recovery' || kind !== 'server',
              ),
              ...(scenario === 'replace' ? [] : dataFailures),
            ]}
            onChange={(enabled, kind) => {
              setFailureEnabled(enabled);
              setFailure(kind);
              if (enabled || enabled !== failureEnabled)
                setRun(value => value + 1);
            }}
          />
        )}
        <Select
          aria-label="Advanced scenarios"
          value={scenario}
          onValueChange={value => {
            setScenario(value as typeof scenario);
            setFailure('network');
            setRun(value => value + 1);
          }}
        >
          <SelectItem value="replace">Remote replacement</SelectItem>
          <SelectItem value="recovery">Data recovery</SelectItem>
          <SelectItem value="lifecycle">Data lifecycle</SelectItem>
          <SelectItem value="data">Remote data sources</SelectItem>
          <SelectItem value="bridge">Independent weather stations</SelectItem>
        </Select>
      </header>
      <iframe
        key={`${scenario}:${run}`}
        ref={frame}
        className="advanced-frame"
        title="Advanced weather experiment"
        src={`/weather?scenario=${scenario}&failure=${failureEnabled ? failure : ''}&run=${run}&after=${scenario === 'lifecycle' ? 'remount' : ''}&target=${scenario === 'replace' ? 'replacement/' : scenario === 'lifecycle' ? 'dynamic/Reload' : ''}`}
      />
    </LabLayout>
  );
}
