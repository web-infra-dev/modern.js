import path from 'path';
import { spawnSync } from 'child_process';

describe('jsnext:source', () => {
  test('process exit status is 0', () => {
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ['--conditions=jsnext:source', '-r', 'tsm', '../../../../src/bin.ts'],
      {
        cwd: path.resolve(__dirname, 'fixtures/config/no-config'),
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
