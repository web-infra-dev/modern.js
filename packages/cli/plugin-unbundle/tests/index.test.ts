import * as path from 'path';
import plugin from '../src';

import { hasTailwind } from '../src/plugins/css';

describe('plugin-unbundle', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
  });

  it('test tailwind plugin exists', () => {
    expect(
      hasTailwind(path.join(__dirname, './fixtures/tailwind-example')),
    ).toBe(true);
  });
});
