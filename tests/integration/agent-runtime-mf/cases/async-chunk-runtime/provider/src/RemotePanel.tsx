export default function RemotePanel() {
  return (
    <section data-testid="remote-panel">
      <strong>Provider: rivendell workspace</strong>
      <p>
        The remote exposes build identifiers that can collide with another
        runtime when async chunks are requested.
      </p>
    </section>
  );
}

