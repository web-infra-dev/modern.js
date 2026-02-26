import { RemoteClientCounter } from './RemoteClientCounter';
import { getServerOnlyInfo } from './serverOnly';

export function RemoteServerCard({ label }: { label: string }) {
  return (
    <section className="remote-server-card">
      <h2>{label}</h2>
      <p className="remote-server-only-value">{getServerOnlyInfo()}</p>
      <RemoteClientCounter />
    </section>
  );
}
