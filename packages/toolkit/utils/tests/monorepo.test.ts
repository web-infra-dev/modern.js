import fs from 'fs';
import { isPnpmWorkspaces } from '../src';

describe('isPnpmWorkspaces', () => {
  test('should return correct result', () => {
    const mockExistsSync = rstest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        input =>
          typeof input === 'string' && input.includes('pnpm-workspace.yaml'),
      );

    expect(isPnpmWorkspaces('/foo')).toBeTruthy();

    mockExistsSync.mockRestore();
  });
});
