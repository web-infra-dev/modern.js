import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'rsc-mf-react-server-dom-client-browser';

let registeredCallbackKey = '';
const getHostActionId = (rawActionId: string, remoteAlias: string) => {
  if (rawActionId.startsWith('remote:')) {
    return rawActionId;
  }

  return `remote:${remoteAlias}:${rawActionId}`;
};

export function registerRemoteServerCallback(
  remoteOrigin: string,
  remoteAlias = 'rscRemote',
  remoteActionIdToHostProxyActionId?: Record<string, string>,
) {
  if (!remoteOrigin) {
    return;
  }
  const callbackKey = JSON.stringify({
    remoteAlias,
    remoteOrigin,
    remoteActionIdToHostProxyActionId,
  });
  if (registeredCallbackKey === callbackKey) {
    return;
  }

  const remoteActionUrl = new URL(remoteOrigin).toString();
  setServerCallback(async (id, args) => {
    const hostActionId =
      remoteActionIdToHostProxyActionId?.[id] ||
      getHostActionId(id, remoteAlias);
    const temporaryReferences = createTemporaryReferenceSet();
    const response = fetch(remoteActionUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': hostActionId,
      },
      body: await encodeReply(args, { temporaryReferences }),
    });
    return createFromFetch(response, { temporaryReferences });
  });
  registeredCallbackKey = callbackKey;
}
