import path from 'path';
import { transform } from '@swc/core';
import { hasAction, hasLoader } from '../../src/router/cli/code/utils';

// Keep the real implementation but record the calls.
rs.mock('@swc/core', { spy: true });

describe('should verify loader and action normally', () => {
  const dataFile = path.resolve(
    __dirname,
    './fixtures/nested-routes/user/$.data.ts',
  );

  test('hasLoader', async () => {
    const isExist = await hasLoader(dataFile);
    expect(isExist).toBe(true);
  });

  test('hasAction', async () => {
    const isExist = await hasAction(dataFile);
    expect(isExist).toBe(true);
  });
});

describe('hasAction and hasLoader', () => {
  const filename = '/src/routes/page.data.ts';

  beforeEach(() => {
    rs.clearAllMocks();
  });

  test.each([
    ['an exported const', 'export const action = () => null;', true],
    ['an exported function', 'export async function action() {}', true],
    ['an aliased export', 'const save = 1;\nexport { save as action };', true],
    ['a named re-export', "export { action } from './other';", true],
    ['an aliased re-export', "export { save as action } from './other';", true],
    ['a namespace re-export', "export * as action from './other';", true],
    [
      'a string export name',
      "const save = 1;\nexport { save as 'action' };",
      true,
    ],
    [
      'an escaped string export name',
      "const save = 1;\nexport { save as '\\x61ct\\ion' };",
      true,
    ],
    ['an escaped identifier', 'export const \\u0061ction = 1;', true],
    ['a star re-export', "export * from './other';", false],
    ['a comment', '// action\nexport const loader = () => null;', false],
    ['a longer name', 'export const actions = 1;', false],
    ['a local binding', 'const action = 1;\nexport default action;', false],
    ['no action at all', 'export const loader = () => null;', false],
  ])('detects the action export of %s', async (_, source, expected) => {
    expect(await hasAction(filename, source)).toBe(expected);
  });

  test('detects the loader export', async () => {
    expect(
      await hasLoader(
        filename,
        'const fetchUser = 1;\nexport { fetchUser as loader };',
      ),
    ).toBe(true);
    expect(await hasLoader(filename, 'export const action = 1;')).toBe(false);
  });

  test('does not parse files that cannot export the name', async () => {
    const loaderOnly =
      "import { getUser } from './api';\nexport const loader = () => getUser();";
    expect(await hasAction(filename, loaderOnly)).toBe(false);
    expect(transform).not.toHaveBeenCalled();

    // Escape sequences may spell the name, so these files are still parsed.
    expect(await hasAction(filename, `${loaderOnly}\nconst a = '\\n';`)).toBe(
      false,
    );
    expect(transform).toHaveBeenCalledTimes(1);

    expect(await hasAction(filename, 'export const action = 1;')).toBe(true);
    expect(transform).toHaveBeenCalledTimes(2);
  });
});
