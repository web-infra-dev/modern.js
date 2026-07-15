import { useLoaderData } from '@modern-js/runtime/router';
import './index.css';

export const loader = async () => ({ now: 'ssr-loader-ok' });

const Index = () => {
  const data = useLoaderData() as { now: string };
  return (
    <div className="container-box">
      <main>{data.now}</main>
    </div>
  );
};

export default Index;
