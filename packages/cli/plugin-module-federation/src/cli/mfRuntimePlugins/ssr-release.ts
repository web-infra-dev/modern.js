import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { clientRemote } from '../../ssr-runtime/release';

/** Pin startup to the public release mapping embedded in this HTML response. */
export default function ssrRelease(): ModuleFederationRuntimePlugin {
  return {
    name: 'modern-ssr-client-release',
    beforeInit(args) {
      if (typeof document === 'undefined') return args;
      for (const script of Array.from(
        document.querySelectorAll('script[data-modern-mf-release]'),
      )) {
        const payload = JSON.parse(script.textContent || '{}');
        if (payload.name !== args.userOptions.name) continue;
        if (!Array.isArray(payload.remotes))
          throw new Error('Invalid MF SSR client release');
        const configured = args.userOptions.remotes || [];
        const targets = payload.remotes
          .map(clientRemote)
          .map((remote: { name: string }) => {
            const existing = configured.find(
              item => item.name === remote.name || item.alias === remote.name,
            );
            return {
              ...existing,
              ...remote,
              name: existing?.name || remote.name,
              alias: existing?.alias,
            };
          });
        const names = new Set(
          targets.map((remote: { name: string }) => remote.name),
        );
        args.userOptions.remotes = [
          ...configured.filter(remote => !names.has(remote.name)),
          ...targets.map((remote: { name: string }) => ({
            ...configured.find(item => item.name === remote.name),
            ...remote,
          })),
        ];
        return args;
      }
      return args;
    },
  };
}
