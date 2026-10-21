import RelayTools from './RelayTools';
import Signal from 'provider/Signal';
export default function Relay() {
  return (
    <section data-testid="nested">
      <p className="relay-label">Nested remote → Modern remote</p>
      <Signal id="nested-signal" />
      <RelayTools />
    </section>
  );
}
