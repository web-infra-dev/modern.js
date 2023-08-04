import { expectType } from 'tsd';

import {
  defineConfig as rawDefineConfig,
  formatError as rawFormatError,
  isLibuildErrorInstance as rawIsLibuildErrorInstance,
  warpErrors as rawPrintError,
  loadConfig as rawLoadConfig,
  run as rawRun,
  LibuildError,
  Libuilder,
} from '../../dist';

declare const defineConfig: typeof rawDefineConfig;
expectType<typeof rawDefineConfig>(defineConfig);

declare const formatError: typeof rawFormatError;
expectType<typeof rawFormatError>(formatError);

declare const isLibuildErrorInstance: typeof rawIsLibuildErrorInstance;
expectType<typeof rawIsLibuildErrorInstance>(isLibuildErrorInstance);

declare const loadConfig: typeof rawLoadConfig;
expectType<typeof rawLoadConfig>(loadConfig);

declare const printError: typeof rawPrintError;
expectType<typeof rawPrintError>(printError);

declare const run: typeof rawRun;
expectType<typeof rawRun>(run);

declare const libuildBundler: Libuilder;
expectType<Libuilder>(libuildBundler);

declare const libuildError: LibuildError;
expectType<LibuildError>(libuildError);
