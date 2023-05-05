import { join } from 'path';
import { createRequire } from 'module';
import { DocConfig } from '../..';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { UserConfig } from '@/shared/types';

const require = createRequire(import.meta.url);

const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

export function getI18nData(docConfig: DocConfig) {
  const { i18nSourcePath = DEFAULT_I18N_SOURCE } = docConfig;
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const i18nSource = require(i18nSourcePath);
    return i18nSource;
  } catch (e) {
    return {};
  }
}

export function i18nVMPlugin(
  _scanDir: string,
  config: UserConfig,
  _isSSR: boolean,
  runtimeTempDir: string,
) {
  const i18nData = getI18nData(config.doc);
  const modulePath = join(runtimeTempDir, `${RuntimeModuleID.I18nText}.js`);
  return new RuntimeModulesPlugin({
    [modulePath]: `export default ${JSON.stringify(i18nData)}`,
  });
}
