import fs from 'fs';
import { createMatchPath } from '../src/utils';

describe('utils', () => {
  test('createMatchPath', () => {
    const mockPaths = {
      '@api': '/api/lambda',
      '@api/service': '/api/service',
    };
    const spy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const matchPath = createMatchPath(mockPaths);
    const helloPath = matchPath('@api/hello');
    expect(helloPath).toBe('/api/lambda/hello');

    const servicePath = matchPath('@api/service/user');
    expect(servicePath).toBe('/api/service/user');
    spy.mockRestore();
  });
});
