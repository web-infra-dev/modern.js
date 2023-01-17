import * as path from 'path';
import { DEFAULT_SERVER_CONFIG } from '@modern-js/utils/constants';
import { addServerConfigToDeps } from '../../src/utils/generateWatchFiles';

jest.useRealTimers();

describe('addServerConfigToDeps', () => {
  it('should add server config to deps', async () => {
    const appDirectory = path.join(__dirname, '../fixtures/utils');
    const deps: string[] = [];
    await addServerConfigToDeps(deps, appDirectory, DEFAULT_SERVER_CONFIG);
    expect(deps.length).toBe(1);
    expect(deps[0]).toBe(
      path.join(appDirectory, `${DEFAULT_SERVER_CONFIG}.js`),
    );
  });
});
