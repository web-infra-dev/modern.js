import { Helmet } from '@modern-js/runtime/head';
import './page.css';

const Index = () => (
  <div className="container-box">
    <Helmet>
      <title>Modern.js</title>
    </Helmet>
    <main>
      <p>Get started by editing src/routes/page.tsx</p>
    </main>
  </div>
);

export default Index;
