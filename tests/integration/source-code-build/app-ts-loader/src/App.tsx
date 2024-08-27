import { type Plugin, VERSION } from '@source-code-build/common';
import { Button } from 'antd';
import './App.css';

export const plugin = { some: true } as Plugin;

const App = () => (
  <div className="container">
    <main>
      {VERSION}
      <Button>click</Button>
    </main>
  </div>
);

export default App;
