import path from 'path';
import { spawnSync } from 'child_process';

const kPackageDir = path.resolve(__dirname, '..');

describe('jsnext:source', () => {
  test('process exit status is 0', () => {
    const { status, stdout, stderr } = spawnSync(
      'node',
      ['--conditions=jsnext:source', '-r', 'btsm', 'src/cli.ts'],
      {
        cwd: kPackageDir,
        encoding: 'utf-8',
      }
    );
    expect(stdout).toBe('');
    expect(stderr.startsWith('Usage: modern <command> [options]')).toBe(true);
    expect(status).toBe(1);
  });
});
