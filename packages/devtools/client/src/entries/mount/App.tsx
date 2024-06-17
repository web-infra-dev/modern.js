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
  return (
    <DevtoolsCapsule
      logo={manifest.context.def.assets.logo}
      src={manifest.client}
    />
  );
};
