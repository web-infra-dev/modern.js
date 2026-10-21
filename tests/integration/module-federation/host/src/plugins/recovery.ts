import type { ModuleFederationRuntimePlugin } from '@module-federation/runtime-core';
export default function recoveryPlugin(): ModuleFederationRuntimePlugin {
  return {
    name: 'mf-lab-recovery',
    async errorLoadRemote(args) {
      // Component-only replacement uses a runtime fallback module. Other
      // failures retain their rejection for the MF adapter fallback.
      if (args.id.includes('offline_')) {
        const { reportRecovery } = await import('../failure/events');
        reportRecovery('Remote fallback', args.id, 'MF errorLoadRemote');
        if (
          args.lifecycle === 'onLoad' &&
          args.id.startsWith('offline_replacement_')
        ) {
          const { createElement } = await import('react');
          const { RecoveryCard } = await import('../failure/components');
          return {
            default: () =>
              createElement(RecoveryCard, {
                status: 'Remote fallback',
                remote: args.id,
                handler: 'MF runtime fallback',
              }),
          };
        }
      }
    },
  };
}
