import 'server-only';
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
