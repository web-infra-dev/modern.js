import { Helmet } from '@modern-js/runtime/head';
import './index.css';

const Index = () => (
  <div className="container-box">
    <Helmet>
      <title>Modern.js</title>
    </Helmet>
    <main>
      <p className="description">
        Get started by editing <code>src/routes/page.tsx</code>
      </p>
    </main>
  </div>
);

export default Index;
