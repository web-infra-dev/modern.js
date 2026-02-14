import fs from 'fs';
import path from 'path';

const readTsconfig = (projectDir: 'host' | 'remote') => {
  const tsconfigPath = path.resolve(
    __dirname,
    `../${projectDir}/tsconfig.json`,
  );
  return JSON.parse(fs.readFileSync(tsconfigPath, 'utf8')) as {
    include?: string[];
    compilerOptions?: {
      rootDir?: string;
    };
  };
};

describe('rsc-mf tsconfig contracts', () => {
  it.each(['host', 'remote'] as const)(
    'keeps %s tsconfig include entries aligned with runtime server config files',
    projectDir => {
      const tsconfig = readTsconfig(projectDir);
      expect(Array.isArray(tsconfig.include)).toBe(true);
      expect(tsconfig.include).toEqual(
        expect.arrayContaining([
          'src',
          'server',
          'modern.config.ts',
          'module-federation.config.ts',
        ]),
      );
    },
  );

  it.each(['host', 'remote'] as const)(
    'keeps %s tsconfig rootDir unset for server dist runtime path',
    projectDir => {
      const tsconfig = readTsconfig(projectDir);
      expect(tsconfig.compilerOptions?.rootDir).toBeUndefined();
    },
  );
});
