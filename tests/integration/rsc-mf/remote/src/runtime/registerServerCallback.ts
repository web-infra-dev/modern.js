import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'rsc-mf-react-server-dom-client-browser';

let registeredCallbackKey = '';
const ALIAS_TOKEN_PATTERN = /^[A-Za-z0-9_.-]+$/;
const DEFAULT_REMOTE_ALIAS = 'rscRemote';
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
  let url: URL;
  try {
    url = new URL(remoteOrigin);
  } catch {
    throw new Error(
      `Remote action callback URL must be an absolute http(s) URL. Received: ${remoteOrigin}`,
    );
  }
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
const getCallbackKey = (remoteAlias: string, remoteActionUrl: string) =>
  `${remoteAlias}::${remoteActionUrl}`;

export function registerRemoteServerCallback(
  remoteOrigin: string,
  remoteAlias = DEFAULT_REMOTE_ALIAS,
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
  const callbackKey = getCallbackKey(normalizedRemoteAlias, remoteActionUrl);
  if (registeredCallbackKey === callbackKey) {
    return;
  }

  setServerCallback(async (id: string, args: unknown[]) => {
    const hostActionId = getHostActionId(id, normalizedRemoteAlias);
    const temporaryReferences = createTemporaryReferenceSet();
    const response = await fetch(remoteActionUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': hostActionId,
      },
      body: await encodeReply(args, { temporaryReferences }),
    });
    if (!response.ok) {
      throw new Error(
        `Remote action callback request failed with status ${response.status} ${response.statusText} (${remoteActionUrl}).`,
      );
    }
    return createFromFetch(Promise.resolve(response), { temporaryReferences });
  });
  registeredCallbackKey = callbackKey;
}
