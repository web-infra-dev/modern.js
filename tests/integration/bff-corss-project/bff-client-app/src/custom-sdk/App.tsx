import hello from 'bff-api-app/api/index';
import { configure } from 'bff-api-app/runtime';
import { useLoader } from '../useLoader';

configure({
  interceptor(request) {
    return async (url, params) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      const path = new URL(urlString, window.location.href);
      const pathString = path.toString().replace('3399', '3401');

      const res = await request(pathString, params);
      const data = await res.json();
      data.message = 'Hello Custom SDK';
      return data;
    };
  },
});

const App = () => {
  const { data, loading } = useLoader(async () => {
    const res = await hello();
    return res;
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const { message = 'bff-express' } = data || {};
  return <div className="hello">{message}</div>;
};

export default App;
