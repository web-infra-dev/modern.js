// Server component - no 'server-only' import needed as the component
// is naturally server-side in RSC architecture
import ClientRoot from './ClientRoot';

export default function App() {
  return (
    <div
      className="host-root"
      style={{ padding: '20px', fontFamily: 'system-ui' }}
    >
      <h1>Host Application</h1>
      <p>This host app consumes remote components from rsc-csr-mf</p>
      <ClientRoot />
    </div>
  );
}
