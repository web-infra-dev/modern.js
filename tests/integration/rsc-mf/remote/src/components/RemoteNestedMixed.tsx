import { RemoteServerCard } from './RemoteServerCard';

export function RemoteNestedMixed({ label }: { label: string }) {
  return (
    <div className="remote-nested-mixed">
      <RemoteServerCard label={label} />
    </div>
  );
}
