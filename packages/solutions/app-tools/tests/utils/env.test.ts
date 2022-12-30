import { getAutoInjectEnv } from '../../src/utils/env';

describe('test env utils', () => {
  it('should get auto inject env vars correctly', async () => {
    process.env.MODERN_NAME = 'Modern.js';
    process.env.MODERN_REGION = 'China';
    process.env.MODERNA_NAME = 'Error';

    const globalVars = getAutoInjectEnv({ metaName: 'modern' } as any);
    expect(globalVars['process.env.MODERN_NAME']).toBe('Modern.js');
    expect(globalVars['process.env.MODERN_REGION']).toBe('China');
    expect(globalVars['process.env.MODERNA_NAME']).toBeUndefined();
  });
});
