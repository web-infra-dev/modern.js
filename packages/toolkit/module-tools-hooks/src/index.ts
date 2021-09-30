import { lifecycle as buildLifeCycle } from './build';
import { lifecycle as devLifeCycle } from './dev';

export { buildLifeCycle, devLifeCycle };

export const lifecycle = () => {
  devLifeCycle();
  buildLifeCycle();
};
