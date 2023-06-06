import { RSPACK_PROVIDER, WEBPACK_PROVIDER } from '@modern-js/builder-shared';
import { isPackageInstalled } from '@modern-js/utils';

export function getProviderType() {
  const root = process.cwd();

  if (isPackageInstalled(RSPACK_PROVIDER, root)) {
    return 'rspack';
  }

  if (isPackageInstalled(WEBPACK_PROVIDER, root)) {
    return 'webpack';
  }

  throw new Error(
    `Failed to load builder provider, please check if you have "${RSPACK_PROVIDER}" or "${WEBPACK_PROVIDER}" installed`,
  );
}

export async function loadProvider() {
  const providerType = getProviderType();

  if (providerType === 'rspack') {
    const { builderRspackProvider } = await import(
      '@modern-js/builder-rspack-provider'
    );
    return builderRspackProvider;
  }

  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
  return builderWebpackProvider;
}
