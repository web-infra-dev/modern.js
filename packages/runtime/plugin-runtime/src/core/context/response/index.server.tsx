import { storage } from '@modern-js/runtime-utils/node';
export const getResponseProxy = () => {
  const context = storage.useContext();
  return context?.responseProxy;
};

export const setHeaders = (headers: Record<string, string>) => {
  const responseProxy = getResponseProxy();
  Object.entries(headers).forEach(([key, value]) => {
    responseProxy!.headers[key] = value;
  });
};

export const setStatus = (status: number) => {
  const responseProxy = getResponseProxy();
  responseProxy!.status = status;
};

export const redirect = (url: string, init?: number | ResponseInit) => {
  const status =
    init === undefined
      ? 307
      : typeof init === 'number'
        ? init
        : (init.status ?? 307);
  const headers =
    init === undefined
      ? {}
      : typeof init === 'number'
        ? {}
        : (init.headers ?? {});

  setStatus(status);
  setHeaders({
    Location: url,
    ...(init && typeof init === 'object'
      ? Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k, String(v)]),
        )
      : {}),
  });
};
