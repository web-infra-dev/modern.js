import path from 'path';
import {
  getProjectsByWorkspaceFile,
  syncGetProjectsByWorkspaceFile,
} from '../src/projects/getProjectsByWorkspaceFile';

const root = path.join(__dirname, './fixtures/mono-1');

// globby needs setImmediate

// @ts-expect-error
global.setImmediate = setTimeout;

// @ts-expect-error
global.clearImmediate = clearTimeout;

describe('get projects', () => {
  it('workspaces is lerna.json', async () => {
    const projects = await getProjectsByWorkspaceFile(
      root,
      {
        enableAutoFinder: true,
      },
      [],
    );

    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe('app-1');

    const projects1 = syncGetProjectsByWorkspaceFile(
      root,
      {
        enableAutoFinder: true,
      },
      [],
    );

    expect(projects1.length).toBe(1);
    expect(projects1[0].name).toBe('app-1');
  });
});
