import type Buffer from 'buffer';
import * as devcert from 'devcert';
import type { DevServerHttpsOptions } from '../../types';

export const genHttpsOptions = async (
  userOptions: DevServerHttpsOptions,
): Promise<{
  key?: Buffer | string;
  cert?: Buffer | string;
}> => {
  const httpsOptions: { key?: string; cert?: string } =
    typeof userOptions === 'boolean' ? {} : userOptions;

  if (!httpsOptions.key || !httpsOptions.cert) {
    const selfsign = await devcert.certificateFor(['localhost']);
    return selfsign;
  }

  return httpsOptions;
};
