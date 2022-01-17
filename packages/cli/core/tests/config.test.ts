import path from 'path';
// import os from 'os';
import { resolveConfig } from '../src/config';
import {
  cli,
  loadUserConfig,
  initAppContext,
  initAppDir,
  manager,
  createPlugin,
  registerHook,
  useRunner,
} from '../src';

// const kOSRootDir =
//   os.platform() === 'win32' ? process.cwd().split(path.sep)[0] : '/';

describe('config', () => {
  it('default', () => {
    expect(resolveConfig).toBeDefined();
    expect(cli).toBeDefined();
    expect(loadUserConfig).toBeDefined();
    expect(initAppContext).toBeDefined();
    expect(initAppDir).toBeDefined();
    expect(manager).toBeDefined();
    expect(createPlugin).toBeDefined();
    expect(registerHook).toBeDefined();
    expect(useRunner).toBeDefined();
  });

  it('initAppDir', async () => {
    expect(await initAppDir(__dirname)).toBe(path.resolve(__dirname, '..'));
    // expect(await initAppDir()).toBe(path.resolve(__dirname, '..'));

    // FIXME: windows 下面会失败，先忽略这个测试
    // try {
    //   await initAppDir(kOSRootDir);
    //   expect(true).toBe(false); // SHOULD NOT BE HERE
    // } catch (err: any) {
    //   expect(err.message).toMatch(/no package.json found in current work dir/);
    // }
  });
});
