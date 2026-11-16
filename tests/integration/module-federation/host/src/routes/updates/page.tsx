import { useEffect, useRef, useState } from 'react';
import { LabNav } from '../../components/Comparison';
import './updates.css';

type UpdateState = {
  mode: 'dev' | 'production';
  scenario: 'ordinary' | 'bridge' | 'service';
  selectedVersion: string;
  versions: { version: string; url: string }[];
  frameUrl: string;
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

export default function ProducerUpdates() {
  const [state, setState] = useState<UpdateState>();
  const [selected, setSelected] = useState('v1');
  const [frameUrl, setFrameUrl] = useState('');
  const [visibleVersion, setVisibleVersion] = useState('Waiting');
  const [renders, setRenders] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [samples, setSamples] = useState<MemorySample[]>([]);
  const [renderKey, setRenderKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const disconnect = useRef<() => void>(() => {});

  useEffect(() => {
    void request<UpdateState>(`/_lab/update/state${window.location.search}`)
      .then(next => {
        setState(next);
        setSelected(next.selectedVersion);
        setFrameUrl(next.frameUrl);
      })
      .catch(error => setError(String(error)));
    return () => disconnect.current();
  }, []);

  // Observe the actual iframe document. In dev this does not change its src:
  // only the federation / framework HMR or reload path can update the view.
  function observeFrame() {
    // A failed document must still leave the controls available for rollback.
    setBusy(false);
    disconnect.current();
    const document = frame.current?.contentDocument;
    if (!document) return;
    let lastVersion = '';
    const observe = () => {
      const version = document
        .querySelector('[data-testid="update-version"]')
        ?.textContent?.trim();
      if (!version || version === lastVersion) return;
      lastVersion = version;
      setVisibleVersion(version);
      setRenders(value => value + 1);
    };
    observe();
    const observer = new MutationObserver(observe);
    observer.observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    disconnect.current = () => observer.disconnect();
  }

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
      // The control response schedules after-response work. Only request a
      // fresh SSR document after the public check confirms the target is active.
      // Keep the URL identical so a changing query cannot bypass the Service
      // result cache. Replacing the iframe still requests a new SSR document.
      setVisibleVersion('Waiting');
      setFrameUrl(next.frameUrl);
      setRenderKey(value => value + 1);
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

  return (
    <>
      <LabNav />
      <main className="updates-shell">
        <header>
          <h1>Producer updates</h1>
          <p>
            {state?.scenario} · {state?.mode}
          </p>
        </header>
        {state?.mode === 'production' ? (
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
        ) : (
          <p>Edit the producer to observe its automatic update below.</p>
        )}
        <p role="status">
          Visible version:{' '}
          <strong data-testid="update-visible">{visibleVersion}</strong>
          {' · '}Completed renders:{' '}
          <strong data-testid="update-renders">{renders}</strong>
        </p>
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
              Samples follow GC. RSS can retain allocated pages even after
              objects are collected.
            </p>
          </>
        )}
        {frameUrl && (
          <iframe
            key={renderKey}
            ref={frame}
            data-testid="update-frame"
            title="Updated weather application"
            src={frameUrl}
            onLoad={observeFrame}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </main>
    </>
  );
}
