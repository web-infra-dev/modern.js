import { getArgv, getCommand, isDevCommand } from '../src/commands';

describe('test commands utils', () => {
  test('should get command correctly', () => {
    process.argv = ['', '', 'dev'];
    expect(getCommand()).toBe('dev');

    process.env.MODERN_ARGV = ['', '', 'start'].join(' ');
    expect(getCommand()).toBe('start');
  });

  test('should get argv correctly', () => {
    delete process.env.MODERN_ARGV;
    process.argv = ['', '', 'dev'];
    expect(getArgv()).toEqual(['dev']);

    process.env.MODERN_ARGV = ['', '', 'start'].join(' ');
    expect(getArgv()).toEqual(['start']);
  });

  test('should detect dev command correctly', () => {
    delete process.env.MODERN_ARGV;
    process.argv = ['', '', 'dev'];
    expect(isDevCommand()).toBeTruthy();

    process.env.MODERN_ARGV = ['', '', 'build'].join(' ');
    expect(isDevCommand()).toBeFalsy();
  });
});
