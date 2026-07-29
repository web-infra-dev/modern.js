import { bar } from '../shared/bar';
import { Foo } from './foo';

const server = () => {
  return `${Foo()}-${bar}`;
};

export default server;
