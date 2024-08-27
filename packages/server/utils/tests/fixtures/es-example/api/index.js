import { useContext } from '@modern-js/runtime/server';
import { shared } from '@shared';

const api = () => {
  const msg = useContext();
  return `${msg}-${shared}-api`;
};

export default api;
