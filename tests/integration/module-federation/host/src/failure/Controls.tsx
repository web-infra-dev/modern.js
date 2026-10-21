export const renderFailures = [
  ['network', 'Remote network failure'],
  ['server', 'Server rendering failure'],
  ['render', 'Component code failure'],
] as const;
export const dataFailures = [
  ['data', 'Weather API unavailable'],
  ['invalid', 'Invalid weather response'],
] as const;
export function FailureControls({
  enabled,
  kind,
  onChange,
  options = renderFailures,
}: {
  enabled: boolean;
  kind: string;
  onChange: (enabled: boolean, kind: string) => void;
  options?: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="failure-controls">
      <label>
        <input
          type="checkbox"
          aria-label="Simulate failure"
          checked={enabled}
          onChange={event => onChange(event.target.checked, kind)}
        />{' '}
        Simulate failure
      </label>
      <select
        aria-label="Failure scenario"
        value={kind}
        onChange={event => onChange(enabled, event.target.value)}
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
