import { path } from '@modern-js/utils';
import tempy from 'tempy';

export const resolveFromFixture = (...args: any[]) => {
  return path.resolve(__dirname, '../fixture', ...args);
};

export const getTempDir = () => {
  return tempy.directory({
    prefix: 'esmpack_test',
  });
};
