import path from 'node:path';
import { fs } from '@modern-js/utils';
import {
  createIsolatedTestApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

test('preserves existing dist files and emits HTML when cleanDistPath is false', async () => {
  const fixtureDir = path.resolve(__dirname, '..');
  const { appDir, cleanup } = await createIsolatedTestApp(fixtureDir);
  const preservedFile = path.join(appDir, 'dist/existing.txt');
  const preservedContent = 'existing output';
  const htmlFile = path.join(appDir, 'dist/html/index/index.html');

  try {
    await fs.outputFile(preservedFile, preservedContent);
    const result = await modernBuild(appDir);

    expect(result.code, `${result.stdout}\n${result.stderr}`).toBe(0);
    await expect(fs.readFile(preservedFile, 'utf8')).resolves.toBe(
      preservedContent,
    );
    expect(await fs.pathExists(htmlFile)).toBe(true);
  } finally {
    await cleanup();
  }
});
