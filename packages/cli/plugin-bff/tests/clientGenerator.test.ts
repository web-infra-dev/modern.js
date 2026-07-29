import os from 'os';
import path from 'path';
import { fs } from '@modern-js/utils';
import clientGenerator from '../src/utils/clientGenerator';

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
});
