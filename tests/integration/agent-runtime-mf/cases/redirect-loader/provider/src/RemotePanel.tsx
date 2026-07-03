export function DashboardPage({ path = '/home' }: { path?: string }) {
  return (
    <section data-testid="remote-panel">
      <strong>Provider: cloud engine dashboard</strong>
      <p>Dashboard route is ready at {path}.</p>
    </section>
  );
}

export default function RemotePanel() {
  return <DashboardPage />;
}
