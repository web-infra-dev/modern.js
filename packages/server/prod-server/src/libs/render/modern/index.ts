import Parser from 'ua-parser-js';
import compareVersions from 'compare-versions';
import { ModernServerContext } from '../../context';
import { NativeModuleNameMap } from './browser-list';

const nativeModules = require('@babel/compat-data/native-modules');

export const supportModern = (context: ModernServerContext) => {
  if (context.query?.modern_es6) {
    return true;
  }

  // no ua in request headers
  const userAgent = context.headers['user-agent'];
  if (!userAgent || typeof userAgent !== 'string') {
    return false;
  }

  const parsedUA = Parser(userAgent);
  const browserName = parsedUA.browser.name;
  const browserVersion = parsedUA.browser.version;
  if (!browserName || !browserVersion) {
    return false;
  }

  const nativeUAName = NativeModuleNameMap[browserName];
  if (!nativeUAName) {
    return false;
  }

  const version = nativeModules['es6.module'][nativeUAName];
  if (!version) {
    return false;
  }

  const result = compareVersions(browserVersion, version);
  return result >= 0;
};

export const getModernEntry = (filepath: string) =>
  filepath.replace(/\.html$/, '-es6.html');
