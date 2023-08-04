import { join } from 'path';
import { loadRawConfig } from '../../../src/config';
import assert from 'assert';
import { CLIConfig } from '../../../src/types';

describe('loadConfig', () => {
  const cwd = __dirname;
  const configFile = 'libuild.config.ts';
  it('should work when use ts config', async () => {
    const { data, path } = await loadRawConfig<CLIConfig>({
      configKey: 'libuild',
      configFile,
      cwd,
    });
    assert(data?.input?.index === './index.ts');
    assert(path === join(cwd, configFile));
    assert(data.sourceMap === true);
  });
});
