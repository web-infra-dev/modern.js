import path from 'node:path';
import {
  checkIsBuildCommands,
  isSubDirOrEqual,
} from '../../src/plugins/analyze/utils';

describe('checkIsBuildCommands', () => {
  const originalModernArgv = process.env.MODERN_ARGV;

  afterEach(() => {
    if (originalModernArgv === undefined) {
      delete process.env.MODERN_ARGV;
    } else {
      process.env.MODERN_ARGV = originalModernArgv;
    }
  });

  it('uses the argv command when it is a build command', () => {
    process.env.MODERN_ARGV = 'node modern build';

    expect(checkIsBuildCommands()).toBe(true);
  });

  it('falls back to the app context for programmatic build commands', () => {
    process.env.MODERN_ARGV = 'node rstest test';

    expect(checkIsBuildCommands('dev')).toBe(true);
    expect(checkIsBuildCommands('start')).toBe(true);
    expect(checkIsBuildCommands('build')).toBe(true);
    expect(checkIsBuildCommands('deploy')).toBe(true);
  });

  it('does not fall back for other programmatic commands', () => {
    process.env.MODERN_ARGV = 'node rstest test';

    expect(checkIsBuildCommands('analyze')).toBe(false);
  });
});

describe('isSubDirOrEqual', () => {
  it('should return true for the same directories', () => {
    const parent = path.resolve('/Users/test');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(true);
  });

  it('should return true for a child directory', () => {
    const parent = path.resolve('/Users');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(true);
  });

  it('should return false for a non-child directory', () => {
    const parent = path.resolve('/Users/test');
    const child = path.resolve('/Users/anotherTest');
    expect(isSubDirOrEqual(parent, child)).toBe(false);
  });

  it('should return false for a directory at a higher level', () => {
    const parent = path.resolve('/Users/test/deeper');
    const child = path.resolve('/Users/test');
    expect(isSubDirOrEqual(parent, child)).toBe(false);
  });
});
