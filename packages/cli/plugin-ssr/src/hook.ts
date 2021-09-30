import ah from 'async_hooks';
import { IncomingHttpHeaders } from 'http';

const storage: ah.AsyncLocalStorage<IncomingHttpHeaders> = ah?.AsyncLocalStorage
  ? new ah.AsyncLocalStorage<string>()
  : (null as any);

export const run = <O>(headers: IncomingHttpHeaders, next: () => O): O =>
  storage.run(headers, next);

export const useHeaders = (): IncomingHttpHeaders => {
  if (!storage) {
    throw new Error(`Unable to use async_hook, please confirm the node version
      `);
  }

  const headers = storage.getStore();

  if (!headers) {
    throw new Error(
      `Can't call useHeaders out of scope, it should be placed on top of the function`,
    );
  }

  return headers;
};
