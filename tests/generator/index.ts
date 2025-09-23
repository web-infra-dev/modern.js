import path from 'path';
import { fs, nanoid } from '@modern-js/utils';
import {
  runCreteCommand,
  runInstallAndBuildProject,
  runLintProject,
} from './utils/command';
import { prepare } from './utils/prepare';
import { usingTempDir } from './utils/tools';

async function createAllProjects(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
) {
  await usingTempDir(tmpDir, async cwd => {
    const projectName = `test-project`;
    await runCreteCommand(repoDir, isLocal, {
      projectName,
      cwd,
      config: {},
    });
    const pkgJSON = fs.readJSONSync(
      path.join(cwd, projectName, 'package.json'),
    );
    pkgJSON.engines = {
      node: process.env.NODE_VERSION,
    };
    fs.writeJSONSync(path.join(cwd, projectName, 'package.json'), pkgJSON, {
      spaces: 2,
    });
  });
}

async function main() {
  try {
    console.info('run test project');
    const { isLocal, repoDir, tmpDir } = await prepare('project');
    await createAllProjects(repoDir, tmpDir, isLocal);
    await runInstallAndBuildProject('project', tmpDir);
    await runLintProject('project', tmpDir);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
