import { Select, SelectItem, Button } from './ui/controls';
import { useEffect, useRef, useState } from 'react';
import './ProducerUpdateControls.css';
import { UpdateResult } from './UpdateResult';
import { LabIcon } from './LabIcon';
import { UpdateRequestControls } from './UpdateRequestControls';

type UpdateState = {
  mode: 'dev' | 'production';
  scenario: 'ordinary' | 'bridge' | 'service';
  selectedVersion: string;
  versions: { version: string; url: string }[];
  pending?: boolean;
};
type MemorySample = {
  role: string;
  pid: number;
  heapUsed: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  gcExposed: boolean;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
const megabytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

export function ProducerUpdateControls({
  scenario,
  onUpdate,
  verifyURL,
}: {
  scenario: UpdateState['scenario'];
  onUpdate?: () => void;
  verifyURL?: string;
}) {
  const [state, setState] = useState<UpdateState>();
  const [selected, setSelected] = useState('v1');
  const [busy, setBusy] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [delayMs, setDelayMs] = useState(0);
  const [error, setError] = useState('');
  const [samples, setSamples] = useState<MemorySample[]>([]);
  const [baseline, setBaseline] = useState<MemorySample[]>([]);
  const [rounds, setRounds] = useState(10);
  const [history, setHistory] = useState<
    { version: string; samples: MemorySample[] }[]
  >([]);
  const [progress, setProgress] = useState('');
  const stop = useRef(false);
  const pending = useRef(new Set<AbortController>());
  useEffect(
    () => () => {
      stop.current = true;
      pending.current.forEach(controller => controller.abort());
      pending.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!process.env.MF_LAB_UPDATES) return;
    void request<UpdateState>(`/_lab/update/state?scenario=${scenario}`)
      .then(next => {
        setState(next);
        setSelected(next.selectedVersion);
      })
      .catch(error => setError(String(error)));
  }, [scenario]);

  async function replace(version: string) {
    const controller = new AbortController();
    pending.current.add(controller);
    const signal =
      delayMs === -1
        ? controller.signal
        : AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
    try {
      const check = await request<UpdateState>(
        `/_lab/update/state?version=${encodeURIComponent(version)}`,
        { signal },
      );
      if (check.pending) {
        await request('/_lab/update/lab/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version, delayMs }),
          signal,
        });
        for (;;) {
          signal.throwIfAborted();
          const status = await request<{
            operation?: { completed: boolean; error?: string };
          }>('/_lab/update/lab/status', { signal });
          if (status.operation?.completed) {
            if (status.operation.error) throw Error(status.operation.error);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      const next = await request<UpdateState>(
        `/_lab/update/state?version=${encodeURIComponent(version)}`,
        { signal },
      );
      setState(next);
      setSelected(next.selectedVersion);
    } finally {
      pending.current.delete(controller);
    }
  }
  async function update() {
    setBusy(true);
    setError('');
    try {
      await replace(selected);
      // Request fresh SSR only after after-response work has published the
      // target. Preserve the document URL, including Service result-cache keys.
      if (onUpdate) {
        onUpdate();
        setBusy(false);
      } else if (
        document
          .querySelector('[data-testid="update-request-lab"]')
          ?.hasAttribute('open')
      ) {
        setBusy(false);
      } else window.location.reload();
    } catch (error) {
      setError(String(error));
      setBusy(false);
    }
  }

  async function capture() {
    const result = await request<{ samples: MemorySample[] }>(
      `/_lab/update/memory?gc=1&scenario=${scenario}`,
    );
    setSamples(result.samples);
    return result.samples;
  }
  async function repeat() {
    if (!Number.isSafeInteger(rounds) || rounds < 1 || rounds > 100) return;
    setBusy(true);
    setError('');
    stop.current = false;
    setRepeating(true);
    setHistory([]);
    try {
      setBaseline(await capture());
      // The held-update controls can also change this runtime. Read its real
      // selection instead of counting a stale dropdown's no-op as a switch.
      const check = await request<UpdateState>('/_lab/update/state?version=v1');
      let current = check.pending ? 'v2' : 'v1';
      for (let index = 0; index < rounds && !stop.current; index++) {
        const version = current === 'v1' ? 'v2' : 'v1';
        setProgress(`${index + 1} / ${rounds} · ${version}`);
        await replace(version);
        const response = await fetch(verifyURL!, {
          signal: AbortSignal.timeout(30000),
        });
        const html = await response.text();
        if (!response.ok || !html.includes(`${version}:initial`))
          throw Error(
            `Round ${index + 1} did not return ${version} SSR output`,
          );
        const measured = await capture();
        setHistory(previous => [...previous, { version, samples: measured }]);
        current = version;
      }
      onUpdate?.();
      setProgress(
        stop.current
          ? 'Stopped after the current round'
          : 'Switches, SSR checks and GC completed',
      );
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
      setRepeating(false);
    }
  }

  async function sampleMemory() {
    setError('');
    try {
      const measured = await capture();
      if (!baseline.length) setBaseline(measured);
    } catch (error) {
      setError(String(error));
    }
  }

  if (!process.env.MF_LAB_UPDATES) return null;
  return (
    <section className="producer-update-controls" aria-label="Producer updates">
      {state?.mode === 'production' ? (
        <>
          <div className="updates-controls">
            <label>
              Producer version{' '}
              <Select
                data-testid="update-select"
                value={selected}
                onValueChange={value => setSelected(value)}
                disabled={busy}
              >
                {state.versions.map(({ version }) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </Select>
            </label>
            <label>
              Delay
              <Select
                data-testid="update-delay"
                value={delayMs}
                disabled={busy}
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
              className="lab-icon-button"
              data-testid="update-apply"
              onClick={update}
              disabled={busy}
            >
              <LabIcon name="refresh" />
              {busy ? 'Updating' : 'Update'}
            </Button>
            <Button
              title="GC & memory sample"
              className="lab-icon-button"
              data-testid="update-memory"
              onClick={sampleMemory}
            >
              <LabIcon name="memory" /> GC
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                try {
                  setBaseline(await capture());
                  setHistory([]);
                } catch (error) {
                  setError(String(error));
                }
              }}
            >
              <LabIcon name="memory" /> Baseline
            </Button>
          </div>
          {verifyURL && (
            <div className="updates-controls lab-repeat-controls">
              <label>
                Switch count{' '}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rounds}
                  disabled={busy}
                  onChange={event => setRounds(Number(event.target.value))}
                />
              </label>
              <Button
                data-testid="update-repeat"
                disabled={
                  busy ||
                  delayMs === -1 ||
                  !Number.isSafeInteger(rounds) ||
                  rounds < 1 ||
                  rounds > 100
                }
                onClick={repeat}
              >
                <LabIcon name="play" /> Run switches
              </Button>
              {repeating && (
                <Button
                  onClick={() => {
                    stop.current = true;
                  }}
                >
                  <LabIcon name="stop" /> Stop
                </Button>
              )}
              <span role="status" data-testid="update-progress">
                {progress}
              </span>
            </div>
          )}
          <UpdateResult active={busy || repeating} />
          <UpdateRequestControls scenario={scenario} />
        </>
      ) : (
        <p>Dev · Version & memory tests use Build + serve</p>
      )}
      {error && (
        <p role="alert" data-testid="update-error">
          {error}
        </p>
      )}
      {samples.length > 0 && (
        <>
          <div className="lab-memory-scroll">
            <table data-testid="update-memory-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>PID</th>
                  <th>Heap MiB</th>
                  <th>RSS MiB</th>
                  <th>External MiB</th>
                  <th>Buffers MiB</th>
                  <th>Δ Heap MiB</th>
                  <th>Δ RSS MiB</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(sample => (
                  <tr key={sample.role}>
                    <th>{sample.role}</th>
                    <td>{sample.pid}</td>
                    <td>{megabytes(sample.heapUsed)}</td>
                    <td>{megabytes(sample.rss)}</td>
                    <td>{megabytes(sample.external)}</td>
                    <td>{megabytes(sample.arrayBuffers)}</td>
                    <td>
                      {baseline.find(value => value.role === sample.role)
                        ?.pid === sample.pid
                        ? megabytes(
                            sample.heapUsed -
                              baseline.find(
                                value => value.role === sample.role,
                              )!.heapUsed,
                          )
                        : 'PID changed'}
                    </td>
                    <td>
                      {baseline.find(value => value.role === sample.role)
                        ?.pid === sample.pid
                        ? megabytes(
                            sample.rss -
                              baseline.find(
                                value => value.role === sample.role,
                              )!.rss,
                          )
                        : 'PID changed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length > 0 && (
            <details>
              <summary>GC samples（{history.length}）</summary>
              <div className="lab-memory-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Version</th>
                      <th>Process</th>
                      <th>PID</th>
                      <th>Heap MiB</th>
                      <th>RSS MiB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.flatMap((round, index) =>
                      round.samples.map(sample => (
                        <tr key={`${index}:${sample.role}`}>
                          <td>{index + 1}</td>
                          <td>{round.version}</td>
                          <td>{sample.role}</td>
                          <td>{sample.pid}</td>
                          <td>{megabytes(sample.heapUsed)}</td>
                          <td>{megabytes(sample.rss)}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
