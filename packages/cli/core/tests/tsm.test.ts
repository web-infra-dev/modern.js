import path from 'path';
import { spawnSync } from 'child_process';

const kPackageDir = path.resolve(__dirname, '..');

describe('jsnext:source', () => {
  test('process exit status is 0', () => {
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ['--conditions=jsnext:source', '-r', 'tsm', 'src/bin.ts'],
      {
        cwd: kPackageDir,
        encoding: 'utf-8',
      },
    );
    expect(
      stdout.includes('Can not find any config file in the current project'),
    ).toBeTruthy();
    expect(
      stdout.includes(
        'No command found, please make sure you have registered plugins correctly.',
      ),
    ).toBeTruthy();
    expect(stderr).toBe('');
    expect(status).toBe(0);
  });
});
