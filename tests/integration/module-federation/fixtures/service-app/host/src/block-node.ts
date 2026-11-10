import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
export default (): ModuleFederationRuntimePlugin => ({
  name: 'service-node-entry-probe',
  loadEntry({ remoteInfo }) {
    if (typeof window === 'undefined' && remoteInfo.name === 'lab_provider') {
      console.error(`SERVICE_NODE_ENTRY_ATTEMPT ${remoteInfo.entry}`);
      throw Error('SERVICE_NODE_ENTRY_BLOCKED');
    }
  },
  afterLoadRemote({ id, expose, recovered, error }) {
    if (typeof window === 'undefined')
      console.info(
        'SERVICE_LOAD_COMPLETE',
        JSON.stringify({
          id,
          expose,
          recovered: Boolean(recovered),
          error: error ? String(error) : undefined,
        }),
      );
  },
});
