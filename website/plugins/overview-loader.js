const path = require('path');
const globby = require('globby');

const versionRouteData = null;

module.exports = () => {
  let versionMetaData;

  if (!versionRouteData) {
    const files = globby.sync(
      path.join(
        __dirname,
        '../.docusaurus/docusaurus-plugin-content-docs/default/version-current-metadata-prop*',
      ),
    );
    const routeFile = files[0];
    versionMetaData = require(routeFile);
  }

  return JSON.stringify(versionMetaData);
};
