import { Helmet } from '@modern-js/runtime/head';
import './index.css';

const Index = () => (
  <div className="container-box">
    <Helmet>
      <title>AB Demo Title</title>
    </Helmet>
    <main>hand-written title instead of framework config</main>
  </div>
);

export default Index;
