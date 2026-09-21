import path from 'path';
import {
  SERVER_TSCONFIG_FILENAME,
  isEsmModuleKind,
  readTsConfigWithExtends,
  resolveServerTsconfig,
  resolveServerTsconfigInfo,
} from '../src';

const fixtures = path.resolve(__dirname, './fixtures/tsconfig');
const fixture = (name: string) => path.join(fixtures, name);

describe('resolveServerTsconfigInfo', () => {
  it('prefers the explicit path even when the convention file exists', () => {
    const appDir = fixture('explicit');
    const info = resolveServerTsconfigInfo(
      appDir,
      'custom/tsconfig.custom.json',
    );

    expect(info).toEqual({
      path: path.join(appDir, 'custom/tsconfig.custom.json'),
      source: 'explicit',
    });
    expect(resolveServerTsconfig(appDir, 'custom/tsconfig.custom.json')).toBe(
      info.path,
    );
  });

  it('keeps an absolute explicit path as is', () => {
    const appDir = fixture('explicit');
    const absolute = path.join(appDir, 'custom/tsconfig.custom.json');

    expect(resolveServerTsconfigInfo(appDir, absolute)).toEqual({
      path: absolute,
      source: 'explicit',
    });
  });

  it('never rewrites an explicit config even if it emits ESM in a commonjs project', () => {
    const appDir = fixture('explicit');
    // custom/tsconfig.custom.json extends the bundler-mode base (ESNext).
    const info = resolveServerTsconfigInfo(
      appDir,
      'custom/tsconfig.custom.json',
      { moduleType: 'commonjs' },
    );

    expect(info.compilerOverrides).toBeUndefined();
  });

  it('uses tsconfig.server.json by convention', () => {
    const appDir = fixture('convention');
    const info = resolveServerTsconfigInfo(appDir);

    expect(info).toEqual({
      path: path.join(appDir, SERVER_TSCONFIG_FILENAME),
      source: 'convention',
    });
    expect(resolveServerTsconfig(appDir)).toBe(info.path);
  });

  it('never rewrites the convention file', () => {
    // tsconfig.json of this fixture is ESNext; the convention file wins and
    // its own module options are trusted.
    const info = resolveServerTsconfigInfo(fixture('convention'), undefined, {
      moduleType: 'commonjs',
    });

    expect(info.source).toBe('convention');
    expect(info.compilerOverrides).toBeUndefined();
  });

  it('falls back to tsconfig.json and overrides ESM output for commonjs projects', () => {
    const appDir = fixture('fallback-esm');
    const info = resolveServerTsconfigInfo(appDir);

    expect(info).toEqual({
      path: path.join(appDir, 'tsconfig.json'),
      source: 'fallback',
      compilerOverrides: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      },
    });
    expect(resolveServerTsconfig(appDir)).toBe(info.path);
  });

  it('respects an explicit moduleType over package.json', () => {
    const info = resolveServerTsconfigInfo(fixture('fallback-esm'), undefined, {
      moduleType: 'module',
    });

    expect(info.source).toBe('fallback');
    expect(info.compilerOverrides).toBeUndefined();
  });

  it('does not rewrite a commonjs fallback config', () => {
    const info = resolveServerTsconfigInfo(fixture('fallback-cjs'));

    expect(info.source).toBe('fallback');
    expect(info.compilerOverrides).toBeUndefined();
  });

  it('does not rewrite type: module projects', () => {
    const info = resolveServerTsconfigInfo(fixture('esm-project'));

    expect(info.source).toBe('fallback');
    expect(info.compilerOverrides).toBeUndefined();
  });

  it('returns the fallback path when tsconfig.json does not exist', () => {
    const appDir = fixture('missing');

    expect(resolveServerTsconfigInfo(appDir)).toEqual({
      path: path.join(appDir, 'tsconfig.json'),
      source: 'fallback',
    });
  });
});

describe('isEsmModuleKind', () => {
  it('matches ESM module kinds case-insensitively', () => {
    for (const value of [
      'ESNext',
      'esnext',
      'ES2015',
      'es6',
      'ES2020',
      'ES2022',
      'Preserve',
    ]) {
      expect(isEsmModuleKind(value)).toBe(true);
    }
    for (const value of [
      'commonjs',
      'CommonJS',
      'NodeNext',
      'node16',
      'umd',
      undefined,
      1,
    ]) {
      expect(isEsmModuleKind(value)).toBe(false);
    }
  });
});

describe('readTsConfigWithExtends', () => {
  it('merges an extends array with later entries and the child winning', () => {
    const appDir = fixture('extends-array');
    const result = readTsConfigWithExtends(path.join(appDir, 'tsconfig.json'));

    expect(result.path).toBe(path.join(appDir, 'tsconfig.json'));
    expect(result.files).toEqual([
      path.join(appDir, 'a.json'),
      path.join(appDir, 'c.json'),
      // `./b` without extension resolves to `./b.json`
      path.join(appDir, 'b.json'),
      path.join(appDir, 'tsconfig.json'),
    ]);
    expect(result.compilerOptions).toEqual({
      // child overrides every parent
      target: 'ES2020',
      // b.json (later entry) overrides a.json
      module: 'esnext',
      // untouched keys are inherited from any parent
      strict: true,
      lib: ['ESNext'],
      jsx: 'preserve',
      baseUrl: './',
      // `paths` is replaced wholesale by the nearest declaring file (b.json)
      paths: { '@b/*': ['./b/*'] },
    });
    expect(result.baseUrl).toBe(appDir);
    expect(result.pathsBaseDir).toBe(appDir);
  });

  it('resolves package presets and keeps comments out of the way', () => {
    const appDir = fixture('fallback-esm');
    const result = readTsConfigWithExtends(path.join(appDir, 'tsconfig.json'));

    expect(result.files[0]).toBe(
      require.resolve('@modern-js/tsconfig/base.json'),
    );
    expect(result.compilerOptions.module).toBe('ESNext');
    expect(result.compilerOptions.moduleResolution).toBe('bundler');
    expect(result.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
    expect(result.baseUrl).toBeUndefined();
    expect(result.pathsBaseDir).toBe(appDir);
    expect(result.raw.extends).toBe('@modern-js/tsconfig/base');
  });

  it('applies a multi-extends server preset on top of the main config', () => {
    const appDir = fixture('convention');
    const result = readTsConfigWithExtends(
      path.join(appDir, SERVER_TSCONFIG_FILENAME),
    );

    expect(result.compilerOptions.module).toBe('NodeNext');
    expect(result.compilerOptions.moduleResolution).toBe('NodeNext');
    expect(result.compilerOptions.noEmit).toBe(false);
    // inherited from the main config through the first extends entry
    expect(result.compilerOptions.strict).toBe(true);
    expect(result.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
    expect(result.pathsBaseDir).toBe(appDir);
  });

  it('resolves baseUrl against the file that declares it', () => {
    const appDir = fixture('alias-inherit-baseurl');
    const result = readTsConfigWithExtends(path.join(appDir, 'tsconfig.json'));

    expect(result.baseUrl).toBe(appDir);
    expect(result.pathsBaseDir).toBe(appDir);
    expect(result.compilerOptions.paths).toEqual({ '@src/*': ['src/*'] });
  });
});
