import { Card } from '@source-code-build/components';
import { Button } from 'antd';
import './App.css';

const App = () => (
  <div className="container">
    <main>
      <Card title="App" content="hello world"></Card>
      <Button>click</Button>
    </main>
  </div>
);

export default App;
