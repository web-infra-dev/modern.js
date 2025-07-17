import type { Rspack } from '@rsbuild/core';

export default async function loader(this: Rspack.LoaderContext<void>) {
  this.cacheable();
  return `
    export const createRequest = () => {}
  `;
}
