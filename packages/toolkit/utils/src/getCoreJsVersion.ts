import * as fs from '../compiled/fs-extra';

export const CORE_JS_PATH = require.resolve('core-js/package.json');

export const getCoreJsVersion = () => {
  try {
    const { version } = fs.readJSONSync(CORE_JS_PATH);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};
