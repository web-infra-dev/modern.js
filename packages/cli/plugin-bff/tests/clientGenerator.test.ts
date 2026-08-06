import os from 'os';
import path from 'path';
import { fs } from '@modern-js/utils';
import clientGenerator, {
  buildClientTypeFacade,
  readDirectoryFiles,
} from '../src/utils/clientGenerator';

describe('clientGenerator', () => {
  it('writes package.json with a trailing newline', async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-client-gen-'));
    const lambdaDir = path.join(appDir, 'api', 'lambda');

    try {
      await fs.mkdir(lambdaDir, { recursive: true });
      await fs.writeFile(
        path.join(lambdaDir, 'user.ts'),
        'export default function handler() {}',
      );
      await fs.writeFile(
        path.join(appDir, 'package.json'),
        JSON.stringify({ name: 'test-app' }, null, 2),
      );

      await clientGenerator({
        prefix: '/api',
        appDir,
        apiDir: path.join(appDir, 'api'),
        lambdaDir,
        existLambda: false,
        relativeDistPath: 'dist',
        relativeApiPath: 'api',
        apiFiles: [path.join(lambdaDir, 'user.ts')],
      });

      const packageContent = await fs.readFile(
        path.join(appDir, 'package.json'),
        'utf8',
      );

      expect(packageContent.endsWith('\n')).toBe(true);
      expect(JSON.parse(packageContent).exports).toHaveProperty('./api/user');
    } finally {
      await fs.remove(appDir);
    }
  });

  it('publishes every declaration under the configured distPath', async () => {
    // A non-default distPath guards against the glob being hardcoded to `dist`.
    const relativeDistPath = 'dist-1';
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-client-gen-'));
    const lambdaDir = path.join(appDir, 'api', 'lambda');

    try {
      await fs.mkdir(lambdaDir, { recursive: true });
      await fs.writeFile(
        path.join(lambdaDir, 'user.ts'),
        'export default function handler() {}',
      );
      await fs.writeFile(
        path.join(appDir, 'package.json'),
        JSON.stringify({ name: 'test-app' }, null, 2),
      );

      await clientGenerator({
        prefix: '/api',
        appDir,
        apiDir: path.join(appDir, 'api'),
        lambdaDir,
        existLambda: false,
        relativeDistPath,
        relativeApiPath: 'api',
        apiFiles: [path.join(lambdaDir, 'user.ts')],
      });

      const packageJson = JSON.parse(
        await fs.readFile(path.join(appDir, 'package.json'), 'utf8'),
      );

      expect(packageJson.files).toContain(`${relativeDistPath}/**/*.d.ts`);
    } finally {
      await fs.remove(appDir);
    }
  });

  describe('readDirectoryFiles', () => {
    it('only processes the API files it is handed, ignoring stray artifacts', async () => {
      const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-read-dir-'));
      const lambdaDir = path.join(appDir, 'api', 'lambda');

      try {
        await fs.mkdir(lambdaDir, { recursive: true });
        const apiFile = path.join(lambdaDir, 'index.ts');
        await fs.writeFile(apiFile, 'export default () => {};');
        // Stray artifacts a bare readdir would have swept in.
        await fs.writeFile(path.join(lambdaDir, 'index.d.ts'), '');
        await fs.writeFile(path.join(lambdaDir, 'index.test.ts'), '');

        const files = await readDirectoryFiles(appDir, lambdaDir, 'dist', [
          apiFile,
        ]);

        expect(files).toHaveLength(1);
        expect(files[0].resourcePath).toBe(apiFile);
      } finally {
        await fs.remove(appDir);
      }
    });
  });

  describe('buildClientTypeFacade', () => {
    it('re-exports the default binding only when the module has one', () => {
      const withDefault = buildClientTypeFacade(
        './dist/client/index.d.ts',
        './dist/api/lambda/index.d.ts',
        true,
      );
      // Relative, POSIX, and no `.d.ts` suffix.
      expect(withDefault).toContain(
        `export { default } from '../api/lambda/index';`,
      );
      expect(withDefault).toContain(`export * from '../api/lambda/index';`);

      const withoutDefault = buildClientTypeFacade(
        './dist/client/upload.d.ts',
        './dist/api/lambda/upload.d.ts',
        false,
      );
      expect(withoutDefault).not.toContain('export { default }');
      expect(withoutDefault).toContain(`export * from '../api/lambda/upload';`);
    });

    it('resolves the specifier from nested client locations', () => {
      const facade = buildClientTypeFacade(
        './dist/client/user/index.d.ts',
        './dist/api/lambda/user/index.d.ts',
        false,
      );
      expect(facade).toContain(`export * from '../../api/lambda/user/index';`);
    });
  });
});
