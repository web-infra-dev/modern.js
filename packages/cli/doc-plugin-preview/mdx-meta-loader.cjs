const { join, basename } = require('path');

module.exports = async function (source) {
  const callback = this.async();
  const { createProcessor } = await import('@mdx-js/mdx');
  const { visit } = await import('unist-util-visit');
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  try {
    const processor = createProcessor();
    const ast = processor.parse(source);
    const index = 1;
    const meta = [];
    visit(ast, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const { value } = node;
        const base = basename(this.resourcePath, '.mdx');
        // FIXME: fix id when support i18n
        const id = `${base}_${index}`;
        const demoDir = join(
          process.cwd(),
          'node_modules',
          '.modern-doc',
          `virtual-demo`,
        );
        const virtualModulePath = join(demoDir, `${id}.tsx`);
        const item = {
          id,
          virtualModulePath,
        };
        meta.push(item);
        fs.ensureDirSync(join(demoDir));
        fs.writeFileSync(virtualModulePath, value);
      }
    });
    const result = `
      ${meta
        .map(item => {
          return `import Demo_${item.id} from '${item.virtualModulePath}';`;
        })
        .join('\n')}
      export default [${meta
        .map(item => {
          return `{
            "id": "${item.id}",
            "component": Demo_${item.id}
          }`;
        })
        .join(',')}];
    `;
    // Avoid infinite loop compilation
    // meta.forEach(item => {
    // this.addDependency(item.virtualModulePath);
    // });
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};
