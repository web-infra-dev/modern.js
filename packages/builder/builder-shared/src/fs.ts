import { isAbsolute, join } from 'path';
import { MODULE_PATH_REGEX } from './constants';
import { removeLeadingSlash } from './utils';
import {
  DistPathConfig,
  NormalizedSharedOutputConfig,
  SharedHtmlConfig,
} from './types';

export function getAbsoluteDistPath(
  cwd: string,
  outputConfig: NormalizedSharedOutputConfig,
) {
  const root = getDistPath(outputConfig, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

export const getDistPath = (
  outputConfig: NormalizedSharedOutputConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = outputConfig;
  const ret = distPath[type];
  if (typeof ret !== 'string') {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

export async function isFileExists(file: string) {
  const { promises, constants } = await import('fs');
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function getPackageNameFromModulePath(modulePath: string) {
  const handleModuleContext = modulePath?.match(MODULE_PATH_REGEX);

  if (!handleModuleContext) {
    return false;
  }

  const [, , scope, name] = handleModuleContext;
  const packageName = ['npm', (scope ?? '').replace('@', ''), name]
    .filter(Boolean)
    .join('.');

  return packageName;
}

export function getHTMLPathByEntry(
  entryName: string,
  config: {
    output: NormalizedSharedOutputConfig;
    html: SharedHtmlConfig;
  },
) {
  const htmlPath = getDistPath(config.output, 'html');
  const filename = config.html.disableHtmlFolder
    ? `${entryName}.html`
    : `${entryName}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}
