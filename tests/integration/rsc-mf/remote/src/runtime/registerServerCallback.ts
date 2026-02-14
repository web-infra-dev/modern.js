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

  // Align with RSC bridge action-id format expected by host runtime plugin.
  return `remote:${remoteAlias}:${rawActionId}`;
};
const getNormalizedRemoteActionUrl = (remoteOrigin: string) => {
  const url = new URL(remoteOrigin);
  url.search = '';
  url.hash = '';
  return url.toString();
};

export function registerRemoteServerCallback(
  remoteOrigin: string,
  remoteAlias = 'rscRemote',
) {
  if (!remoteOrigin) {
    return;
  }
  const remoteActionUrl = getNormalizedRemoteActionUrl(remoteOrigin);
  const callbackKey = JSON.stringify({
    remoteAlias,
    remoteActionUrl,
  });
  if (registeredCallbackKey === callbackKey) {
    return;
  }

  setServerCallback(async (id, args) => {
    const hostActionId = getHostActionId(id, remoteAlias);
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
