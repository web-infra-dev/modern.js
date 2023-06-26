import type { LoaderContext } from 'webpack';

export default async function loader(this: LoaderContext<void>) {
  this.cacheable();
  return `
    export const createRequest = () => {}
  `;
}
