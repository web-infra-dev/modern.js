import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@rstest/core';
import { LEGACY_PLUGINS, resolveActivation } from './activation';

const directories: string[] = [];
function project(withConfig = false) {
  const directory = mkdtempSync(path.join(tmpdir(), 'modern-mf-config-'));
  directories.push(directory);
  if (withConfig)
    writeFileSync(
      path.join(directory, 'module-federation.config.ts'),
      'export default { name: "test" }',
    );
  return directory;
}
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
const noLegacy = () => false;
describe('built-in Module Federation activation', () => {
  it('keeps ordinary applications disabled and discovers the default config', () => {
    expect(resolveActivation(undefined, project(), noLegacy).enabled).toBe(
      false,
    );
    expect(resolveActivation(undefined, project(true), noLegacy).enabled).toBe(
      true,
    );
  });
  it('allows the legacy plugin only when built-in MF is disabled', () => {
    const directory = project(true);
    expect(resolveActivation(false, directory, () => true).enabled).toBe(false);
    for (const name of LEGACY_PLUGINS) {
      for (const value of [undefined, true, { config: { name: 'inline' } }]) {
        expect(() =>
          resolveActivation(value, directory, plugin => plugin === name),
        ).toThrow(/cannot be enabled together.*moduleFederation: false/);
      }
    }
  });
  it('fails explicit activation with a missing config and accepts an inline config', () => {
    const directory = project();
    expect(() => resolveActivation(true, directory, noLegacy)).toThrow(
      'Configuration file not found',
    );
    const config = { name: 'inline' };
    expect(
      resolveActivation({ config }, directory, noLegacy).config.config,
    ).toBe(config);
  });
  it('resolves custom config paths from the application directory', () => {
    const directory = project();
    writeFileSync(path.join(directory, 'custom.ts'), 'export default {}');
    const options = {
      configPath: 'custom.ts',
      ssr: false,
      fetchServerQuery: { token: 'query' },
      secondarySharedTreeShaking: true,
    };
    const result = resolveActivation(options, directory, noLegacy);
    expect(result.config).toEqual({
      ...options,
      configPath: path.join(directory, 'custom.ts'),
    });
    expect(options.configPath).toBe('custom.ts');
  });
});
