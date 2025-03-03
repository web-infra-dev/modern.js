export const getResponseProxy = () => {
  return null;
};
export const setHeaders = (headers: Record<string, string>) => {};
export const setStatus = (status: number) => {};
export const redirect = (url: string, init?: number | ResponseInit) => {
  console.warn(
    `You should not use this API in the browser, please use the router's redirect or useNavigate method.`,
  );
};
