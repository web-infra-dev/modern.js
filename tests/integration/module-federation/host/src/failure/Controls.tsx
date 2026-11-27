import { Checkbox, Select, SelectItem } from '../components/ui/controls';
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
        <Checkbox
          aria-label="Simulate failure"
          checked={enabled}
          onCheckedChange={checked => onChange(checked, kind)}
        />{' '}
        Simulate failure
      </label>
      <Select
        aria-label="Failure scenario"
        value={kind}
        onValueChange={value => onChange(enabled, value)}
      >
        {options.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
