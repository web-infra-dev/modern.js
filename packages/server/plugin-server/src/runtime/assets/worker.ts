import { getAssetsTags, injectAssetsTags } from './assets';

export { getAssetsTags, getAssets } from './assets';

export const injectAssets = async ({
  html,
  pathname,
  nonce,
  nestedRoutes,
  routesManifest,
  routesJson,
}: {
  html: string;
  pathname?: string;
  nonce?: string;
  nestedRoutes: Record<string, any>;
  routesManifest: Record<string, any>;
  routesJson: Record<string, any>;
}) => {
  if (
    typeof html !== 'string' ||
    html?.includes('window._SSR_DATA') ||
    !pathname
  ) {
    return html;
  }

  try {
    if (!nestedRoutes || !routesManifest || !routesJson) {
      return html;
    }

    let injectedHtml = html;
    const { cssLinks, scripts } = getAssetsTags(
      html,
      nestedRoutes,
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
