export * from '@modern-js/render/client';
export const isRedirectResponse = (res: Response) => {
  return res.headers.get('X-Modernjs-Redirect') != null;
};
