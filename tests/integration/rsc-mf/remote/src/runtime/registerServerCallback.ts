import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'rsc-mf-react-server-dom-client-browser';

let registeredCallbackKey = '';
const ALIAS_TOKEN_PATTERN = /^[A-Za-z0-9_.-]+$/;
const getNormalizedRawActionId = (rawActionId: string) => {
  const normalizedRawActionId = rawActionId.trim();
  if (!normalizedRawActionId || /\s/.test(normalizedRawActionId)) {
    throw new Error(
      `Remote action id must be a non-empty token without whitespace. Received: ${rawActionId}`,
    );
  }
  return normalizedRawActionId;
};
const getHostActionId = (rawActionId: string, remoteAlias: string) => {
  const normalizedRawActionId = getNormalizedRawActionId(rawActionId);
  if (normalizedRawActionId.startsWith('remote:')) {
    return normalizedRawActionId;
  }

  // Align with RSC bridge action-id format expected by host runtime plugin.
  return `remote:${remoteAlias}:${normalizedRawActionId}`;
};
const getNormalizedRemoteActionUrl = (remoteOrigin: string) => {
  const url = new URL(remoteOrigin);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Remote action callback URL must use http or https. Received protocol: ${url.protocol}`,
    );
  }
  if (url.username || url.password) {
    throw new Error(
      'Remote action callback URL must not include embedded credentials.',
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
  const normalizedRemoteOrigin = remoteOrigin.trim();
  if (!normalizedRemoteOrigin) {
    return;
  }
  const normalizedRemoteAlias = remoteAlias.trim();
  if (
    !normalizedRemoteAlias ||
    normalizedRemoteAlias.includes(':') ||
    !ALIAS_TOKEN_PATTERN.test(normalizedRemoteAlias)
  ) {
    throw new Error(
      `Remote alias must be a non-empty token (letters, numbers, "-", "_", ".") without ":" delimiters. Received: ${remoteAlias}`,
    );
  }
  const remoteActionUrl = getNormalizedRemoteActionUrl(normalizedRemoteOrigin);
  const callbackKey = JSON.stringify({
    remoteAlias: normalizedRemoteAlias,
    remoteActionUrl,
  });
  if (registeredCallbackKey === callbackKey) {
    return;
  }

  setServerCallback(async (id: string, args: unknown[]) => {
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
