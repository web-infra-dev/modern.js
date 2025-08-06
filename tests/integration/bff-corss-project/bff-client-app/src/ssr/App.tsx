import hello from 'bff-api-app/api/index';
import { configure } from 'bff-api-app/runtime';
import { useLoader } from '../useLoader';

configure({
  setDomain() {
    return 'http://127.0.0.1:3401';
  },
});

const App = () => {
  const { data } = useLoader(async () => {
    const res = await hello();
    return res;
  });
  const { message = 'bff-express' } = data || {};
  return <div className="hello">{message}</div>;
};

export default App;
