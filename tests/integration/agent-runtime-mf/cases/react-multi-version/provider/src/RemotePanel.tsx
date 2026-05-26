import { LegacyZustandWidget } from '@otrade/transaction_adapter';

export default function RemotePanel() {
  return (
    <section data-testid="remote-panel">
      <strong>Provider: billing widget</strong>
      <p>
        The exposed checkout widget imports a legacy adapter before it renders
        the actual business component.
      </p>
      <LegacyZustandWidget />
    </section>
  );
}
