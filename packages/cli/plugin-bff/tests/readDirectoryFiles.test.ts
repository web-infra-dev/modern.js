import os from 'os';
import path from 'path';
import { fs } from '@modern-js/utils';
import { readDirectoryFiles } from '../src/utils/clientGenerator';

const setupLambdaDir = async () => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-lambda-scan-'));
  const lambdaDir = path.join(appDir, 'api', 'lambda');
  const write = (name: string, content = 'export const get = () => 1;') =>
    fs.outputFile(path.join(lambdaDir, name), content);

  await write('index.ts');
  await write('upload.ts');
  await write('user/[id].ts');
  // stray artifacts that must never be treated as api modules
  await write('index.d.ts', 'export declare const get: () => number;');
  await write('upload.d.ts', 'export declare const upload: unknown;');
  await write('user/[id].d.ts', 'export declare const user: unknown;');
  await write('_app.ts');
  await write('index.test.ts');

  return { appDir, lambdaDir };
};

describe('readDirectoryFiles', () => {
  it('applies the ApiRouter file rules and skips d.ts/test/private files', async () => {
    const { appDir, lambdaDir } = await setupLambdaDir();

    const files = await readDirectoryFiles(appDir, lambdaDir, 'dist');
    const names = files
      .map(f => path.relative(lambdaDir, f.resourcePath))
      .sort();

    expect(names).toEqual([
      'index.ts',
      'upload.ts',
      path.join('user', '[id].ts'),
    ]);
  });

  it('keeps FileDetails paths consistent with the previous walker', async () => {
    const { appDir, lambdaDir } = await setupLambdaDir();

    const files = await readDirectoryFiles(appDir, lambdaDir, 'dist');
    const upload = files.find(f => f.name === 'upload');

    expect(upload).toBeTruthy();
    expect(upload!.targetDir).toBe('dist/client/upload.js');
    expect(upload!.relativeTargetDistDir).toBe('./dist/api/lambda/upload.d.ts');
    expect(upload!.exportKey).toBe('upload');
  });
});
