import fs from 'fs';
import { isPnpmWorkspaces, isModernjsMonorepo } from '../src/monorepo';

describe('isPnpmWorkspaces', () => {
  test('should return correct result', () => {
    const mockExistsSync = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        input =>
          typeof input === 'string' && input.includes('pnpm-workspace.yaml'),
      );

    expect(isPnpmWorkspaces('/foo')).toBeTruthy();

    mockExistsSync.mockRestore();
  });
});

describe('isModernjsMonorepo', () => {
  test('should return false if there is no package.json', () => {
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(isModernjsMonorepo('/foo')).toBeFalsy();
    mockExistsSync.mockRestore();
  });
});
