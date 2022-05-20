import path from 'path';
import { spawnSync } from 'child_process';

const kPackageDir = path.resolve(__dirname, '..');

describe('jsnext:source', () => {
  test('process exit status is 0', () => {
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ['--conditions=jsnext:source', '-r', 'btsm', 'src/bin.ts'],
      {
        cwd: kPackageDir,
        encoding: 'utf-8',
      },
    );
    expect(stdout).toBe('');
    expect(stderr).toBe('');
    expect(status).toBe(0);
  });
});
