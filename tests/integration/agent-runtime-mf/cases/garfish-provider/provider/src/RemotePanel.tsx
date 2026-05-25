export default function RemotePanel() {
  return (
    <section data-testid="remote-panel">
      <strong>Provider: garfish child application</strong>
      <p>
        The remote represents a child app whose entry loaded but provider export
        and mounted state still need separate checks.
      </p>
    </section>
  );
}

