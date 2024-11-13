import path from 'path';
import { fs } from '@modern-js/utils';
import {
  modernInline,
  runRouterDataFnStr,
  runWindowFnStr,
} from '../src/router/runtime/constants';

(async () => {
  const targetDir = path.join(__dirname, '../static');
  await fs.ensureDir(targetDir);

  const modernDefineInitPath = path.join(targetDir, 'modern-inline.js');
  await fs.writeFile(modernDefineInitPath, modernInline, 'utf-8');

  const runRouterDataFilePath = path.join(
    targetDir,
    'modern-run-router-data-fn.js',
  );
  await fs.writeFile(runRouterDataFilePath, runRouterDataFnStr, 'utf-8');

  const runWindowFilePath = path.join(targetDir, 'modern-run-window-fn.js');
  await fs.writeFile(runWindowFilePath, runWindowFnStr, 'utf-8');

  console.info('Generate static files successfully');
})();
