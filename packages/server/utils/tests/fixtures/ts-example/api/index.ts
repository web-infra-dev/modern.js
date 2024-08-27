import { useContext } from '@modern-js/runtime/server';
import { shared } from '@shared/index';

const api = () => {
  const msg = useContext();
  return `${msg}-${shared}-api`;
};

export default api;
