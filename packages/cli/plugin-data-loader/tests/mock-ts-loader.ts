// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @babel/no-invalid-this */
import type { LoaderContext } from 'webpack';

export default async function loader(this: LoaderContext<void>) {
  this.cacheable();
  return `
    export const createRequest = () => {}
  `;
}
