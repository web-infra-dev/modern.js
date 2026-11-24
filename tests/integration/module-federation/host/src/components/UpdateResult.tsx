import { Button } from './ui/controls';
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
export function UpdateResult({ active = false }: { active?: boolean }) {
  const [state, setState] = useState<Observation>();
  const [error, setError] = useState('');
  const pending = Boolean(state?.operation && !state.operation.completed);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const response = await fetch('/_lab/update/lab/status');
        if (!response.ok) throw Error(`HTTP ${response.status}`);
        const next: Observation = await response.json();
        if (!stopped) {
          setState(next);
          setError('');
          if (active || (next.operation && !next.operation.completed)) {
            timer = setTimeout(poll, 250);
          }
        }
      } catch (error) {
        if (!stopped) {
          setError(String(error));
          if (active) timer = setTimeout(poll, 250);
        }
      }
    }
    void poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, pending]);
  const operation = state?.operation;
  if (!operation) return error ? <p role="alert">{error}</p> : null;
  const result = operation.result;
  const badgeState = result
    ? 'applied'
    : operation.completed
      ? 'failed'
      : operation.held
        ? 'paused'
        : 'updating';
  return (
    <div data-testid="update-evidence">
      <div className="lab-update-result" role="status">
        <strong
          className={`lab-result-badge is-${badgeState}`}
          data-testid="update-mode"
          data-state={badgeState}
        >
          {result
            ? result.mode === 'entries'
              ? 'Partial update'
              : 'Application update'
            : operation.completed
              ? 'Update failed'
              : operation.held
                ? 'Paused'
                : 'Updating'}
        </strong>
        {!operation.completed && operation.held && (
          <Button
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
            Resume
          </Button>
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
          <summary>Entry changes</summary>
          <table className="lab-change-table" data-testid="update-entry-diff">
            <thead>
              <tr>
                <th>Entry</th>
                <th>Runtime</th>
                <th>Root module</th>
                <th>Result</th>
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
                    <td>{changed ? 'Replaced' : 'Retained'}</td>
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
