import {
  FailureControls,
  renderFailures,
  dataFailures,
} from '../../failure/Controls';
import { useState, useEffect, useRef } from 'react';
import { LabNav } from '../../components/Comparison';
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
    <div className="advanced-shell">
      <LabNav />
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
        <select
          aria-label="Advanced scenarios"
          value={scenario}
          onChange={event => {
            setScenario(event.target.value as typeof scenario);
            setFailure('network');
            setRun(value => value + 1);
          }}
        >
          <option value="replace">Remote replacement</option>
          <option value="recovery">Data recovery</option>
          <option value="lifecycle">Data lifecycle</option>
          <option value="data">Remote data sources</option>
          <option value="bridge">Independent weather stations</option>
        </select>
      </header>
      <iframe
        key={`${scenario}:${run}`}
        ref={frame}
        className="advanced-frame"
        title="Advanced weather experiment"
        src={`/weather?scenario=${scenario}&failure=${failureEnabled ? failure : ''}&run=${run}&after=${scenario === 'lifecycle' ? 'remount' : ''}&target=${scenario === 'replace' ? 'replacement/' : scenario === 'lifecycle' ? 'dynamic/Reload' : ''}`}
      />
    </div>
  );
}
