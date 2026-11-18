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
            {owner && (
              <>
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
                <label>
                  等待
                  <select
                    aria-label="Producer update delay"
                    value={delayMs}
                    disabled={pending}
                    onChange={event => setDelayMs(Number(event.target.value))}
                  >
                    <option value="0">无延迟</option>
                    <option value="1000">1 s</option>
                    <option value="3000">3 s</option>
                    <option value="5000">5 s</option>
                    <option value="-1">手动放行</option>
                  </select>
                </label>
                <button
                  data-testid="request-start"
                  disabled={pending}
                  onClick={() => action('start')}
                >
                  <LabIcon name="refresh" />
                  更新依赖
                </button>
                <button
                  data-testid="request-release"
                  disabled={!pending}
                  onClick={() => action('release')}
                >
                  <LabIcon name="play" />
                  放行
                </button>
              </>
            )}
            <label>
              新请求策略{' '}
              <select
                data-testid="request-policy"
                value={policy}
                onChange={event => setPolicy(event.target.value)}
              >
                <option value="wait">等待 SSR</option>
                <option value="csr" disabled={Boolean(owner)}>
                  返回 CSR
                </option>
                <option value="reject">返回 503</option>
              </select>
            </label>
            <button data-testid="request-add" onClick={addFrame}>
              <LabIcon name="plus" />
              请求
            </button>
            <button
              title="清空请求"
              aria-label="清空请求"
              onClick={() => setFrames([])}
            >
              <LabIcon name="trash" />
            </button>
          </div>
          <p
            data-testid="request-state"
            data-held={Boolean(state?.operation?.held && pending)}
          >
            {pending
              ? state?.operation?.held
                ? '等待放行'
                : '更新中'
              : '就绪'}
          </p>
          {owner && (
            <p data-testid="request-result">
              {state?.operation?.result &&
                `${state.operation.result.mode === 'entries' ? '局部更新' : '全量更新'} · ${state.operation.result.entries?.join(', ') || ''}`}
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
                  请求 {frame.id} · {frame.policy}
                </h3>
                <p>
                  {frame.elapsed === undefined
                    ? '等待响应'
                    : `HTTP ${frame.status} · ${frame.elapsed} ms · ${frame.version || '无版本'}`}
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
