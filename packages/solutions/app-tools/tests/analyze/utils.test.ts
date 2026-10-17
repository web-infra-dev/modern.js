import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { rs } from '@rstest/core';
import {
  checkIsBuildCommands,
  isSubDirOrEqual,
  walkDirectory,
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

  it('ignores non-build argv commands', () => {
    process.env.MODERN_ARGV = 'node rstest test';

    expect(checkIsBuildCommands()).toBe(false);
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

describe('walkDirectory', () => {
  let root: string;

  // The previous implementation, used as the reference for the output order.
  const statWalkDirectory = (dir: string): string[] =>
    fs.readdirSync(dir).reduce<string[]>((previous, filename) => {
      const filePath = path.join(dir, filename);
      if (fs.statSync(filePath).isDirectory()) {
        return [...previous, ...statWalkDirectory(filePath)];
      } else {
        return [...previous, filePath];
      }
    }, []);

  const writeFiles = (files: string[]) => {
    for (const file of files) {
      const filePath = path.join(root, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '');
    }
  };

  const relative = (files: string[], dir = root) =>
    files.map(file => path.relative(dir, file).split(path.sep).join('/'));

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-walk-directory-'));
  });

  afterEach(() => {
    rs.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('returns the files of nested directories in the previous order', () => {
    writeFiles([
      'a.txt',
      'b/c.txt',
      'b/d/e.txt',
      'b/d/f/g.txt',
      'b/h.txt',
      'i/j.txt',
      'k.txt',
    ]);
    fs.mkdirSync(path.join(root, 'empty'));
    const expected = statWalkDirectory(root);
    const statSync = rs.spyOn(fs, 'statSync');

    const files = walkDirectory(root);

    expect(files).toEqual(expected);
    expect(relative(files).sort()).toEqual([
      'a.txt',
      'b/c.txt',
      'b/d/e.txt',
      'b/d/f/g.txt',
      'b/h.txt',
      'i/j.txt',
      'k.txt',
    ]);
    // Directory entries already know their type, so no stat is needed.
    expect(statSync).not.toHaveBeenCalled();
  });

  it('follows symlinked directories and files', ctx => {
    writeFiles(['real/dir/a.txt', 'real/dir/nested/b.txt', 'real/file.txt']);
    writeFiles(['public/c.txt']);
    const publicDir = path.join(root, 'public');
    const link = (target: string, linkPath: string, type?: 'junction') => {
      try {
        fs.symlinkSync(
          path.join(root, target),
          path.join(publicDir, linkPath),
          type,
        );
        return true;
      } catch {
        return false;
      }
    };
    // A junction needs no permission on Windows, a file symlink may need one.
    const hasDirLink = link('real/dir', 'linked-dir', 'junction');
    const hasFileLink = link('real/file.txt', 'linked-file.txt');
    if (!hasDirLink && !hasFileLink) {
      // Platform without symlink permission (e.g. some Windows CI).
      ctx.skip();
    }
    const expected = statWalkDirectory(publicDir);
    const statSync = rs.spyOn(fs, 'statSync');

    const files = walkDirectory(publicDir);

    expect(files).toEqual(expected);
    expect(relative(files, publicDir).sort()).toEqual([
      'c.txt',
      ...(hasDirLink ? ['linked-dir/a.txt', 'linked-dir/nested/b.txt'] : []),
      ...(hasFileLink ? ['linked-file.txt'] : []),
    ]);
    // Only the symlinks need a stat.
    expect(statSync).toHaveBeenCalledTimes(
      Number(hasDirLink) + Number(hasFileLink),
    );
  });

  it('keeps the order for a large flat directory', () => {
    writeFiles(Array.from({ length: 500 }, (_, i) => `file-${i}.txt`));

    expect(walkDirectory(root)).toEqual(statWalkDirectory(root));
  });
});
