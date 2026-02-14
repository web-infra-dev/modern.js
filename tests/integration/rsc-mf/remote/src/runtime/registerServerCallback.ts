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
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Remote action callback URL must use http or https. Received protocol: ${url.protocol}`,
    );
  }
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
  const normalizedRemoteAlias = remoteAlias.trim();
  if (!normalizedRemoteAlias || normalizedRemoteAlias.includes(':')) {
    throw new Error(
      `Remote alias must be a non-empty identifier without ":" delimiters. Received: ${remoteAlias}`,
    );
  }
  const remoteActionUrl = getNormalizedRemoteActionUrl(remoteOrigin);
  const callbackKey = JSON.stringify({
    remoteAlias: normalizedRemoteAlias,
    remoteActionUrl,
  });
  if (registeredCallbackKey === callbackKey) {
    return;
  }

  setServerCallback(async (id, args) => {
    const hostActionId = getHostActionId(id, normalizedRemoteAlias);
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
