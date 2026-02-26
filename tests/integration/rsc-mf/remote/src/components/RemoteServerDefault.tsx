import { getServerOnlyInfo } from './serverOnly';

export default function RemoteServerDefault({ label }: { label: string }) {
  return (
    <section className="remote-server-default-card">
      <h2>{label}</h2>
      <p className="remote-server-default-server-only">{getServerOnlyInfo()}</p>
    </section>
  );
}
