import { ServerManifest } from '@modern-js/devtools-kit/runtime';
import { FC } from 'react';
import { DevtoolsCapsule } from '@/components/Devtools/Capsule';

declare global {
  interface Window {
    __modern_js_devtools_manifest: ServerManifest;
  }
}

export const App: FC = () => {
  const manifest = window.__modern_js_devtools_manifest;
  if (!manifest) throw new TypeError('Devtools manifest is not found');

  const clientSrc = manifest.client;
  const manifestSrc = manifest.source;
  const frameBoxUrl = new URL(clientSrc, location.href);
  if (manifestSrc) {
    const manifestUrl = new URL(manifestSrc, location.href);
    frameBoxUrl.searchParams.set('src', manifestUrl.href);
  }

  return (
    <DevtoolsCapsule
      logo={manifest.context.def.assets.logo}
      src={frameBoxUrl.href}
    />
  );
};
