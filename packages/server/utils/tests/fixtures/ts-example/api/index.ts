import { shared } from '@shared/index';
import { useContext } from '@modern-js/runtime/server';

const api = () => {
  const msg = useContext();
  return `${msg}-${shared}-api`;
};

export default api;
