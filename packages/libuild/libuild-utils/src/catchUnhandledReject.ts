export const catchUnhandledReject = <T>(f: Promise<T>, callback: (err: Error) => any): Promise<T> => {
  return f.catch(callback);
};
