import plugin from '../../src/state';
import { statePlugin } from '../../src/state/cli';

describe('plugin-state', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(statePlugin).toBeDefined();
  });
});
