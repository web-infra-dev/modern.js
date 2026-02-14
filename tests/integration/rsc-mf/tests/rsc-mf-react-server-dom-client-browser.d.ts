declare module 'rsc-mf-react-server-dom-client-browser' {
  export function setServerCallback(
    callback: (id: string, args: unknown[]) => Promise<unknown>,
  ): void;

  export function createTemporaryReferenceSet(): unknown;

  export function encodeReply(
    value: unknown,
    options: { temporaryReferences: unknown },
  ): Promise<BodyInit>;

  export function createFromFetch(
    response: Promise<Response>,
    options: { temporaryReferences: unknown },
  ): unknown;
}
