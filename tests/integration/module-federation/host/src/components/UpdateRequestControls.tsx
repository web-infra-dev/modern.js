import { Select, SelectItem, Button } from './ui/controls';
import { LabIcon } from './LabIcon';
import { useEffect, useRef, useState } from 'react';

type State = {
  pid: number;
  configuredScope: string;
  serviceDependencies: boolean;
  operation?: {
    version: string;
    held: boolean;
    completed: boolean;
    error?: string;
    result?: { mode: string; entries?: string[]; reasons?: string[] };
  };
  status?: {
    stage: string;
    application: { phase: string; pendingRequests: number };
  };
  entries: { entry: string; runtime: number }[];
};
type Frame = {
  id: number;
  url: string;
  started: number;
  policy: string;
  elapsed?: number;
  status?: number;
  version?: string;
};
async function control<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(
    `/_lab/update/lab/${path}`,
    body && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw Error(await response.text());
  return response.json();
}

export function UpdateRequestControls({
  scenario,
}: {
  scenario: 'ordinary' | 'bridge' | 'service';
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>();
  const [version, setVersion] = useState('v2');
  const [delayMs, setDelayMs] = useState(-1);
  const [owner, setOwner] = useState('');
  const [policy, setPolicy] = useState('wait');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [error, setError] = useState('');
  const nextId = useRef(0);
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next = await control<State>(`${owner}status`);
        if (!stopped) setState(next);
      } catch (error) {
        if (!stopped) setError(String(error));
      }
      if (!stopped) timer = setTimeout(poll, 200);
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [open, owner]);
  async function action(name: string) {
    setError('');
    try {
      await control(
        `${owner}${name}`,
        name === 'start' ? { version, delayMs } : {},
      );
    } catch (error) {
      setError(String(error));
    }
  }
  async function addFrame() {
    if (owner) {
      try {
        await control(`${owner}policy`, { policy });
      } catch (error) {
        setError(String(error));
        return;
      }
    }
    const url = new URL(
      scenario === 'ordinary'
        ? '/weather?render=ssr&data=local'
        : `/${scenario === 'bridge' ? 'bridge-ssr' : 'service'}/forecast/today`,
      location.origin,
    );
    url.searchParams.set('__labPolicy', policy);
    url.searchParams.set('labFrame', '1');
    url.searchParams.set('__labRequest', String(++nextId.current));
    if (scenario === 'ordinary' && process.env.MF_LAB_SSR_SCOPE === 'entries')
      url.searchParams.set('static', '1');
    if (owner) url.searchParams.set('remote', 'nested');
    setFrames(previous => [
      ...previous,
      { id: nextId.current, url: url.href, policy, started: performance.now() },
    ]);
  }
  const pending = Boolean(state?.operation && !state.operation.completed);
  return (
    <details
      data-testid="update-request-lab"
      onToggle={event => setOpen(event.currentTarget.open)}
    >
      <summary>Requests during updates</summary>
      {open && (
        <>
          <div className="updates-controls">
            <label>
              Update process{' '}
              <Select
                data-testid="request-owner"
                value={owner}
                disabled={pending}
                onValueChange={value => {
                  setOwner(value);
                  setPolicy('wait');
                }}
              >
                <SelectItem value="">Host</SelectItem>
                {state?.serviceDependencies && scenario === 'service' && (
                  <SelectItem value="producer/">
                    Service producer · nested SSR dependency
                  </SelectItem>
                )}
              </Select>
            </label>
            {owner && (
              <>
                <label>
                  Target version{' '}
                  <Select
                    data-testid="request-version"
                    value={version}
                    disabled={pending}
                    onValueChange={value => setVersion(value)}
                  >
                    <SelectItem value="v1">v1</SelectItem>
                    <SelectItem value="v2">v2</SelectItem>
                  </Select>
                </label>
                <label>
                  Delay
                  <Select
                    aria-label="Producer update delay"
                    value={delayMs}
                    disabled={pending}
                    onValueChange={value => setDelayMs(Number(value))}
                  >
                    <SelectItem value="0">No delay</SelectItem>
                    <SelectItem value="1000">1 s</SelectItem>
                    <SelectItem value="3000">3 s</SelectItem>
                    <SelectItem value="5000">5 s</SelectItem>
                    <SelectItem value="-1">Manual resume</SelectItem>
                  </Select>
                </label>
                <Button
                  data-testid="request-start"
                  disabled={pending}
                  onClick={() => action('start')}
                >
                  <LabIcon name="refresh" />
                  Update dependency
                </Button>
                <Button
                  data-testid="request-release"
                  disabled={!pending}
                  onClick={() => action('release')}
                >
                  <LabIcon name="play" />
                  Resume
                </Button>
              </>
            )}
            <label>
              Request policy{' '}
              <Select
                data-testid="request-policy"
                value={policy}
                onValueChange={value => setPolicy(value)}
              >
                <SelectItem value="wait">Wait for SSR</SelectItem>
                <SelectItem value="csr" disabled={Boolean(owner)}>
                  Return CSR
                </SelectItem>
                <SelectItem value="reject">Return 503</SelectItem>
              </Select>
            </label>
            <Button data-testid="request-add" onClick={addFrame}>
              <LabIcon name="plus" />
              Request
            </Button>
            <Button
              title="Clear requests"
              aria-label="Clear requests"
              onClick={() => setFrames([])}
            >
              <LabIcon name="trash" />
            </Button>
          </div>
          <p
            data-testid="request-state"
            data-held={Boolean(state?.operation?.held && pending)}
          >
            {pending
              ? state?.operation?.held
                ? 'Paused'
                : 'Updating'
              : 'Ready'}
          </p>
          {owner && (
            <p data-testid="request-result">
              {state?.operation?.result &&
                `${state.operation.result.mode === 'entries' ? 'Partial update' : 'Application update'} · ${state.operation.result.entries?.join(', ') || ''}`}
            </p>
          )}
          {(error || state?.operation?.error) && (
            <p role="alert">{error || state?.operation?.error}</p>
          )}
          <div className="request-frame-grid">
            {frames.map(frame => (
              <section
                key={frame.id}
                data-testid="request-frame"
                data-policy={frame.policy}
                data-status={frame.status || 'pending'}
              >
                <h3>
                  Request {frame.id} · {frame.policy}
                </h3>
                <p>
                  {frame.elapsed === undefined
                    ? 'Pending response'
                    : `HTTP ${frame.status} · ${frame.elapsed} ms · ${frame.version || 'No version'}`}
                </p>
                <iframe
                  title={`Update request ${frame.id}`}
                  src={frame.url}
                  onLoad={event => {
                    const target = event.currentTarget.contentWindow;
                    if (!target || target.location.href === 'about:blank')
                      return;
                    const navigation = target.performance.getEntriesByType(
                      'navigation',
                    )[0] as PerformanceNavigationTiming;
                    const value = {
                      elapsed: Math.round(performance.now() - frame.started),
                      status: navigation.responseStatus,
                      version:
                        target.document.querySelector(
                          '[data-testid="update-version"]',
                        )?.textContent || '',
                    };
                    setFrames(previous =>
                      previous.map(item =>
                        item.id === frame.id ? { ...item, ...value } : item,
                      ),
                    );
                  }}
                />
              </section>
            ))}
          </div>
        </>
      )}
    </details>
  );
}
