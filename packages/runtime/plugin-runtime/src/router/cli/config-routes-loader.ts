async function RoutesLoader(this: any, source: any, sourcemap: any) {
  let nextSource = source || '';
  const callback = this.async();
  const options = this.getOptions();

  nextSource = `
    ${
      options.loading
        ? `export { default as LoadingComponent } from '${options.loading}'`
        : 'export const LoadingComponent = undefined'
    }
    ${nextSource}
  `;

  if (options.lazy) {
    nextSource = `
    import loadable from '@modern-js/runtime/loadable';
    export const lazy = {mode: 'loadable'};
    ${nextSource}
    `;
  } else {
    nextSource = `
    export const lazy = false;
    ${nextSource}
    `;
  }

  callback(null, nextSource, sourcemap);
}

export default RoutesLoader;
