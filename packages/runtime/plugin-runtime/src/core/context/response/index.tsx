export const getResponseProxy = () => {
  return null;
};
export const setHeaders = (_headers: Record<string, string>) => {};
export const setStatus = (_status: number) => {};
export const redirect = (_url: string, _init?: number | ResponseInit) => {
  console.warn(
    `You should not use this API in the browser, please use the router's redirect or useNavigate method.`,
  );
};
