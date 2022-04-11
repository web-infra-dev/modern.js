const path = require('path');
const { fs } = require('@modern-js/utils');

const { readdirSync, readFileSync, copySync } = fs;

const getCssFiles = appDir =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css$/.test(filepath),
  );

const readCssFile = (appDir, filename) =>
  readFileSync(path.resolve(appDir, `dist/static/css/${filename}`), 'utf8');

const copyModules = appDir => {
  copySync(
    path.resolve(appDir, '_node_modules'),
    path.resolve(appDir, 'node_modules'),
  );
};

module.exports = {
  getCssFiles,
  readCssFile,
  copyModules,
};
