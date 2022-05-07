import * as path from 'path';
import { fs, yaml } from '@modern-js/utils';
import { JsonFile } from '@rushstack/node-core-library';
import { WORKSPACE_FILE } from '../../constants';
import type { ICommandConfig, IPnpmWorkSpace } from '../../type';
import type { DagOperator } from '../../dag/operator';
import { installByPackageManager } from '../../utils/install';

export interface IInstallConfig extends ICommandConfig {
  auto?: boolean;
}

const replaceWorkspaces = ({
  rootPath,
  projectsInWorkspaces,
}: {
  rootPath: string;
  projectsInWorkspaces: string[];
}) => {
  // pnpm
  const pnpmWsFilePath = path.join(rootPath, WORKSPACE_FILE.PNPM);
  if (fs.existsSync(pnpmWsFilePath)) {
    const pnpmWorkspace = fs.readFileSync(pnpmWsFilePath, 'utf-8');
    const originalPnpmWorkspaces = yaml.load(pnpmWorkspace) as IPnpmWorkSpace;
    fs.writeFileSync(
      pnpmWsFilePath,
      yaml.dump({ packages: projectsInWorkspaces }),
    );
    return () => {
      yaml.dump(originalPnpmWorkspaces);
    };
  }

  const pkgFilePath = path.join(rootPath, WORKSPACE_FILE.YARN);
  if (fs.existsSync(pkgFilePath)) {
    const pkg = JsonFile.load(pkgFilePath);
    if (pkg?.workspaces?.packages) {
      const originalPkg = pkg;
      pkg.workspaces.packages = projectsInWorkspaces;
      JsonFile.save(pkg, pkgFilePath);
      return () => {
        JsonFile.save(originalPkg, pkgFilePath);
      };
    }
  }

  return false;
};

export const runInstallTask = async (
  projectNames: string[],
  operator: DagOperator,
  config: IInstallConfig,
) => {
  const { rootPath, packageManager } = config;
  let projectsInWorkspaces: string[] = [];

  if (projectNames.length === 0) {
    console.info('install all projects');
    return;
  }

  for (const projectName of projectNames) {
    const allDeps = operator.getNodeAllDependencyData(projectName);
    projectsInWorkspaces = [
      ...projectsInWorkspaces,
      path.relative(rootPath, operator.getNodeData(projectName)!.extra.path),
      ...allDeps.map(p => path.relative(rootPath, p.extra.path)),
    ];
  }
  const noDupProjectList = Array.from(new Set(projectsInWorkspaces));

  const restorWorkspace = replaceWorkspaces({
    rootPath,
    projectsInWorkspaces: noDupProjectList,
  });

  await installByPackageManager(packageManager, { rootPath, removeLock: true });

  if (restorWorkspace) {
    restorWorkspace();
  }
};
