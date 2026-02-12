'use server-entry';
import { RemoteNestedMixed } from './components/RemoteNestedMixed';

const App = () => {
  return (
    <div>
      <h1>Remote RSC Module Federation</h1>
      <RemoteNestedMixed label="Remote Standalone Tree" />
    </div>
  );
};

export default App;
