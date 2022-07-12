import path from 'path';
import tempy from 'tempy';

export const resolveFromFixture = (...args: any[]) =>
  path.resolve(__dirname, '../fixture', ...args);

export const getTempDir = () =>
  tempy.directory({
    prefix: 'esmpack_test',
  });
