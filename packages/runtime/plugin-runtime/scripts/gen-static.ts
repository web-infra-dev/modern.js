import path from 'path';
import { fs } from '@modern-js/utils';
import {
  defineRunInlineAndRouterDataInit,
  initRouterDataAttrs,
  runRouterDataFnStr,
  runWindowFnStr,
} from '../src/router/runtime/constants';

(async () => {
  const targetDir = path.join(__dirname, '../static');
  await fs.ensureDir(targetDir);

  const modernDefineInitPath = path.join(targetDir, 'modern-define-init.js');
  await fs.writeFile(
    modernDefineInitPath,
    defineRunInlineAndRouterDataInit,
    'utf-8',
  );

  const initRouterDataFilePath = path.join(
    targetDir,
    'router-data-attr-init-inline.js',
  );
  await fs.writeFile(initRouterDataFilePath, initRouterDataAttrs, 'utf-8');

  const runRouterDataFilePath = path.join(
    targetDir,
    'modern-run-router-data-fn.js',
  );
  await fs.writeFile(runRouterDataFilePath, runRouterDataFnStr, 'utf-8');

  const runWindowFilePath = path.join(targetDir, 'modern-run-window-fn.js');
  await fs.writeFile(runWindowFilePath, runWindowFnStr, 'utf-8');

  console.info('Generate static files successfully');
})();
