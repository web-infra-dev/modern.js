import { BrowserRouter, Route, Routes } from 'react-router';

function ProjectDetailRoute() {
  return <p>Project detail route is running with its own router root.</p>;
}

function RemoteRouterRoot() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ProjectDetailRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function RemotePanel() {
  return (
    <section data-testid="remote-panel">
      <strong>Provider: volcano console route</strong>
      <p>
        The exposed module still renders the provider app router root instead of
        a plain page component.
      </p>
      <RemoteRouterRoot />
    </section>
  );
}
