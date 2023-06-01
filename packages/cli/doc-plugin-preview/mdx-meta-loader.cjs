const { demoMeta } = require('./dist');

module.exports = async function () {
  const callback = this.async();
  const demos = demoMeta[this.resourcePath] || [];
  try {
    const result = `
      ${demos
        .map(item => {
          return `import Demo_${item.id} from '${item.virtualModulePath}';`;
        })
        .join('\n')}
      export default [${demos
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
