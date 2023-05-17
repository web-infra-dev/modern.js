const { join, basename } = require('path');
const { processor } = require('@mdx-js/mdx');

const visit = require('unist-util-visit');

module.exports = async function (source) {
  const callback = this.async();

  try {
    const ast = processor.parse(source);
    const { RspackVirtualModulePlugin } = await import(
      'rspack-plugin-virtual-module'
    );
    const index = 1;
    const meta = [];
    visit(ast, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const { value } = node;
        const base = basename(this.resourcePath);
        // FIXME: fix id when support i18n
        const id = `${base}-${index}`;
        const virtualModulePath = join(
          process.cwd(),
          'node_modules',
          '.modern-doc',
          `virtual-demo`,
          `${id}.tsx`,
        );
        const item = {
          id,
          virtualModulePath,
        };
        meta.push(item);
        new RspackVirtualModulePlugin({}).write(virtualModulePath, value);
      }
    });
    const result = `
      ${meta
        .map(item => {
          return `import Demo-${item.id} from '${item.virtualModulePath}';`;
        })
        .join('\n')}
      export default ${meta.map(item => {
        return {
          id: item.id,
          component: `Demo-${item.id}`,
        };
      })}
    `;
    meta.forEach(item => {
      this.addDependency(item.virtualModulePath);
    });
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};
