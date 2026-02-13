import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'rsc-mf-react-server-dom-client-browser';

let registeredRemoteOrigin = '';

export function registerRemoteServerCallback(remoteOrigin: string) {
  if (!remoteOrigin || registeredRemoteOrigin === remoteOrigin) {
    return;
  }

  const remoteActionUrl = new URL('/', remoteOrigin).toString();
  console.log(`[rsc-mf] registerRemoteServerCallback -> ${remoteActionUrl}`);
  setServerCallback(async (id, args) => {
    console.log(`[rsc-mf] remote callback action id -> ${id}`);
    const temporaryReferences = createTemporaryReferenceSet();
    const response = fetch(remoteActionUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': id,
      },
      body: await encodeReply(args, { temporaryReferences }),
    });
    return createFromFetch(response, { temporaryReferences });
  });
  registeredRemoteOrigin = remoteOrigin;
}
