import path from 'node:path';
import fs from 'fs';
import {
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_SPEC_FILE,
} from '@modern-js/utils/universal/constants';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { getAssetsTags, injectAssetsTags } from './assets';

export { getAssetsTags, getAssets } from './assets';

export const injectAssets = async ({
  html,
  pathname,
  distDir,
  nonce,
}: {
  html: string;
  pathname?: string;
  distDir: string;
  nonce?: string;
}) => {
  //  If is not CSR, return html
  if (
    typeof html !== 'string' ||
    html?.includes('window._SSR_DATA') ||
    !pathname
  ) {
    return html;
  }

  try {
    const nestedRoutesSpec = path.join(distDir, NESTED_ROUTE_SPEC_FILE);
    if (!fs.existsSync(nestedRoutesSpec)) {
      return html;
    }

    let injectedHtml = html;
    const routesJson = await import(path.join(distDir, ROUTE_SPEC_FILE));
    const nestedRouteSpec = await import(nestedRoutesSpec);
    const routesManifest = await import(
      path.join(distDir, ROUTE_MANIFEST_FILE)
    );

    const { cssLinks, scripts } = getAssetsTags(
      html,
      nestedRouteSpec,
      routesJson,
      routesManifest,
      pathname,
      nonce,
    );

    injectedHtml = injectAssetsTags(injectedHtml, cssLinks, scripts);

    return injectedHtml;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    return html;
  }
};
