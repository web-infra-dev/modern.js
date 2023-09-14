import { describe, expect, it } from 'vitest';
import {
  isSatisfyRspackMinimumVersion,
  supportedRspackMinimumVersion,
  getRspackVersion,
} from '@/shared/rspackVersion';

describe('rspack version', () => {
  it('isSatisfyRspackMinimumVersion', async () => {
    expect(await isSatisfyRspackMinimumVersion()).toBeTruthy();

    expect(await isSatisfyRspackMinimumVersion('0.1.0')).toBeFalsy();

    expect(
      await isSatisfyRspackMinimumVersion(supportedRspackMinimumVersion),
    ).toBeTruthy();

    expect(await isSatisfyRspackMinimumVersion('1.0.0')).toBeTruthy();

    expect(
      await isSatisfyRspackMinimumVersion(
        '0.2.7-canary-efa0dc6-20230817005622',
      ),
    ).toBeFalsy();

    expect(
      await isSatisfyRspackMinimumVersion(
        `${supportedRspackMinimumVersion}-canary-efa0dc6-20230817005622`,
      ),
    ).toBeTruthy();
  });

  it('getRspackVersion', async () => {
    expect(await getRspackVersion()).toBeDefined();
  });
});
