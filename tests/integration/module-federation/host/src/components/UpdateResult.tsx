import { LabIcon } from './LabIcon';
import { useEffect, useState } from 'react';

type Entry = { entry: string; runtime: number; modules: (number | null)[] };
type Observation = {
  pid: number;
  operation?: {
    version: string;
    completed: boolean;
    held: boolean;
    delayMs: number;
    before: Entry[];
    after?: Entry[];
    result?: {
      mode: string;
      entries?: string[];
      reasons?: string[];
      timingsMs?: { total?: number };
    };
    error?: string;
  };
};
export function UpdateResult() {
  const [state, setState] = useState<Observation>();
  const [error, setError] = useState('');
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch('/_lab/update/lab/status');
        if (!response.ok) throw Error(`HTTP ${response.status}`);
        const next = await response.json();
        if (!stopped) {
          setState(next);
          setError('');
        }
      } catch (error) {
        if (!stopped) setError(String(error));
      } finally {
        if (!stopped) timer = setTimeout(poll, 250);
      }
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);
  const operation = state?.operation;
  if (!operation) return error ? <p role="alert">{error}</p> : null;
  const result = operation.result;
  return (
    <div data-testid="update-evidence">
      <div className="lab-update-result" role="status">
        <strong className="lab-result-badge" data-testid="update-mode">
          {result
            ? result.mode === 'entries'
              ? '局部更新'
              : '全量更新'
            : operation.completed
              ? '更新失败'
              : operation.held
                ? '等待放行'
                : '更新中'}
        </strong>
        {!operation.completed && operation.held && (
          <button
            data-testid="request-release"
            className="lab-icon-button"
            onClick={async () => {
              try {
                const response = await fetch('/_lab/update/lab/release', {
                  method: 'POST',
                });
                if (!response.ok) throw Error(await response.text());
              } catch (error) {
                setError(String(error));
              }
            }}
          >
            <LabIcon name="play" />
            放行
          </button>
        )}
        <span>{operation.version}</span>
        {result?.entries && <span>{result.entries.join(', ')}</span>}
        {result?.timingsMs?.total !== undefined && (
          <span>{Math.round(result.timingsMs.total)} ms</span>
        )}
        <small>PID {state.pid}</small>
        {result?.reasons?.length ? (
          <span>{result.reasons.join(', ')}</span>
        ) : null}
      </div>
      {(operation.error || error) && (
        <p role="alert">{operation.error || error}</p>
      )}
      {operation.after && (
        <details>
          <summary>入口变化</summary>
          <table className="lab-change-table" data-testid="update-entry-diff">
            <thead>
              <tr>
                <th>入口</th>
                <th>Runtime</th>
                <th>根模块</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {operation.after.map(after => {
                const before = operation.before.find(
                  item => item.entry === after.entry,
                );
                const changed =
                  before?.runtime !== after.runtime ||
                  JSON.stringify(before?.modules) !==
                    JSON.stringify(after.modules);
                return (
                  <tr
                    key={after.entry}
                    data-entry={after.entry}
                    data-changed={changed}
                  >
                    <th>{after.entry}</th>
                    <td>
                      {before?.runtime ?? '—'} → {after.runtime}
                    </td>
                    <td>
                      {before?.modules.join(', ') || '—'} →{' '}
                      {after.modules.join(', ')}
                    </td>
                    <td>{changed ? '已替换' : '保留'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
