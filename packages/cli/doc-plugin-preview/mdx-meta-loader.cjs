const { demoMeta } = require('./dist');

module.exports = async function () {
  const callback = this.async();
  try {
    const result = `
      ${demoMeta
        .map(item => {
          return `import Demo_${item.id} from '${item.virtualModulePath}';`;
        })
        .join('\n')}
      export default [${demoMeta
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
