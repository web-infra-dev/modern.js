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
      await control(`${owner}${name}`, name === 'start' ? { version } : {});
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
      <summary>缓存更新期间的请求</summary>
      {open && (
        <>
          <p>
            Start a held update, open several request frames, then release it.
            Each click creates an independent document. Release before the
            configured request timeout expires.
          </p>
          <div className="updates-controls">
            <label>
              更新进程{' '}
              <select
                data-testid="request-owner"
                value={owner}
                disabled={pending}
                onChange={event => {
                  setOwner(event.target.value);
                  setPolicy('wait');
                }}
              >
                <option value="">Host</option>
                {state?.serviceDependencies && scenario === 'service' && (
                  <option value="producer/">
                    Service producer · nested SSR dependency
                  </option>
                )}
              </select>
            </label>
            <label>
              目标版本{' '}
              <select
                data-testid="request-version"
                value={version}
                disabled={pending}
                onChange={event => setVersion(event.target.value)}
              >
                <option value="v1">v1</option>
                <option value="v2">v2</option>
              </select>
            </label>
            <button
              data-testid="request-start"
              disabled={pending}
              onClick={() => action('start')}
            >
              开始并暂停更新
            </button>
            <button
              data-testid="request-release"
              disabled={!pending}
              onClick={() => action('release')}
            >
              释放更新
            </button>
            <label>
              新请求策略{' '}
              <select
                data-testid="request-policy"
                value={policy}
                onChange={event => setPolicy(event.target.value)}
              >
                <option value="wait">Wait for SSR</option>
                <option value="csr" disabled={Boolean(owner)}>
                  Return CSR shell (Host HTML only)
                </option>
                <option value="reject">Return 503</option>
              </select>
            </label>
            <button data-testid="request-add" onClick={addFrame}>
              发起请求 iframe
            </button>
            <button onClick={() => setFrames([])}>清空请求</button>
          </div>
          <p data-testid="request-state">
            {state?.status?.application.phase || 'serving'} ·{' '}
            {state?.status?.stage || 'idle'}
            {state?.operation?.held && pending ? ' · held' : ''}
          </p>
          <p data-testid="request-result">
            {state?.operation?.result &&
              `Applied: ${state.operation.result.mode}${state.operation.result.entries ? ` (${state.operation.result.entries.join(', ')})` : ''}${state.operation.result.reasons?.length ? ` · ${state.operation.result.reasons.join(', ')}` : ''}`}
          </p>
          <small>
            PID {state?.pid} · configured scope: {state?.configuredScope} ·
            entry runtimes:{' '}
            {state?.entries
              .map(record => `${record.entry}=${record.runtime}`)
              .join(', ')}
          </small>
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
                    ? 'Waiting for response…'
                    : `HTTP ${frame.status} · document loaded in ${frame.elapsed} ms · ${frame.version || 'no weather version'}`}
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
