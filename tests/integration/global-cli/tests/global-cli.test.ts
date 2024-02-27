import path from 'path';
import { spawnSync } from 'child_process';

describe('jsnext:source', () => {
  test('process exit status is 0', () => {
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ['--conditions=jsnext:source', '-r', 'tsm', './bin/index.ts', 'init'],
      {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf-8',
      },
    );

    expect(stdout.includes('run init command in global-cli')).toBeTruthy();
    expect(
      stdout.includes(
        'No command found, please make sure you have registered plugins correctly.',
      ),
    ).toBeFalsy();
    expect(stderr).toBe('');
    expect(status).toBe(0);
  });
});
