import { expect, describe, it } from 'vitest';
import { DEFAULT_BROWSERSLIST } from '../src';
import { getBrowserslistWithDefault } from '../src/getBrowserslist';

describe('getBrowserslistWithDefault', () => {
  it('should get default browserslist correctly', async () => {
    expect(await getBrowserslistWithDefault(__dirname, {}, 'web')).toEqual(
      DEFAULT_BROWSERSLIST.web,
    );
    expect(await getBrowserslistWithDefault(__dirname, {}, 'node')).toEqual(
      DEFAULT_BROWSERSLIST.node,
    );
    expect(
      await getBrowserslistWithDefault(__dirname, {}, 'modern-web'),
    ).toEqual(DEFAULT_BROWSERSLIST['modern-web']);
    expect(
      await getBrowserslistWithDefault(__dirname, {}, 'web-worker'),
    ).toEqual(DEFAULT_BROWSERSLIST['web-worker']);
  });

  it('should override browserslist when using overrideBrowserslist config', async () => {
    const override = ['Android >= 4.4', 'iOS >= 8'];
    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'web',
      ),
    ).toEqual(override);
  });

  it('should allow to override browserslist according to target', async () => {
    const override = {
      web: ['Android >= 4.4', 'iOS >= 8'],
      node: ['node >= 12'],
    };

    expect(
      await getBrowserslistWithDefault(
        __dirname,
        {
          output: {
            overrideBrowserslist: override,
          },
        },
        'node',
      ),
    ).toEqual(override.node);
  });
});
