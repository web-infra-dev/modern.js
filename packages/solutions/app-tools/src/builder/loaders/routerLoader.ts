import type { LoaderContext } from 'webpack';

function loader(this: LoaderContext<void>, source: string) {
  // eslint-disable-next-line @babel/no-invalid-this
  this.cacheable();
  // eslint-disable-next-line @babel/no-invalid-this
  const { target } = this._compiler!.options;
  if (target === 'node' || (Array.isArray(target) && target.includes('node'))) {
    return source;
  }
  // eslint-disable-next-line @babel/no-invalid-this
  const { resourcePath } = this;
  const code = `
    export { default } from "${resourcePath}";
  `;
  return code;
}

export default loader;
