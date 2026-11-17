import { useEffect, useState } from 'react';
import './ProducerUpdateControls.css';
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
}: {
  scenario: UpdateState['scenario'];
  onUpdate?: () => void;
}) {
  const [state, setState] = useState<UpdateState>();
  const [selected, setSelected] = useState('v1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [samples, setSamples] = useState<MemorySample[]>([]);

  useEffect(() => {
    if (!process.env.MF_LAB_UPDATES) return;
    void request<UpdateState>(`/_lab/update/state?scenario=${scenario}`)
      .then(next => {
        setState(next);
        setSelected(next.selectedVersion);
      })
      .catch(error => setError(String(error)));
  }, [scenario]);

  async function update() {
    setBusy(true);
    setError('');
    try {
      const signal = AbortSignal.timeout(30000);
      let next = await request<UpdateState>('/_lab/update/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: selected }),
        signal,
      });
      while (next.pending) {
        signal.throwIfAborted();
        await new Promise(resolve => setTimeout(resolve, 100));
        next = await request<UpdateState>(
          `/_lab/update/state?version=${encodeURIComponent(selected)}`,
          { signal },
        );
      }
      setState(next);
      // Request fresh SSR only after after-response work has published the
      // target. Preserve the document URL, including Service result-cache keys.
      if (onUpdate) {
        onUpdate();
        setBusy(false);
      } else window.location.reload();
    } catch (error) {
      setError(String(error));
      setBusy(false);
    }
  }

  async function sampleMemory() {
    setError('');
    try {
      const result = await request<{ samples: MemorySample[] }>(
        '/_lab/update/memory?gc=1',
      );
      setSamples(result.samples);
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
              <select
                data-testid="update-select"
                value={selected}
                onChange={event => setSelected(event.target.value)}
                disabled={busy}
              >
                {state.versions.map(({ version }) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </label>
            <button data-testid="update-apply" onClick={update} disabled={busy}>
              {busy ? 'Updating…' : 'Update and render'}
            </button>
            <button data-testid="update-memory" onClick={sampleMemory}>
              GC and sample memory
            </button>
          </div>
          <UpdateRequestControls scenario={scenario} />
        </>
      ) : (
        <p>Edit the producer to observe its automatic update below.</p>
      )}
      {error && (
        <p role="alert" data-testid="update-error">
          {error}
        </p>
      )}
      {samples.length > 0 && (
        <>
          <table data-testid="update-memory-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>PID</th>
                <th>Heap MiB</th>
                <th>RSS MiB</th>
                <th>External MiB</th>
                <th>Buffers MiB</th>
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
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Samples follow GC. RSS can retain allocated pages even after objects
            are collected.
          </p>
        </>
      )}
    </section>
  );
}
