import chalk from 'chalk';
import logger from 'consola';
import type { PackageJSON } from '..';

function getWorkspaceDeps(content: PackageJSON['content']) {
  const deps = {
    ...content.dependencies,
    ...content.devDependencies,
  };

  return Object.keys(deps).filter(key => deps[key].includes('workspace'));
}

/**
 * Should not contain cyclic workspace dependencies.
 *
 * @example incorrect
 * {
 *   "name": "foo"
 *   "devDependencies": {
 *     "bar": "workspace:*"
 *   }
 * }
 *
 * {
 *   "name": "bar"
 *   "devDependencies": {
 *     "foo": "workspace:*"
 *   }
 * }
 */
export function noCyclicWorkspaceDependencies(packageJSONs: PackageJSON[]) {
  let failed = false;
  const depsMap = new Map<
    string,
    {
      path: string;
      deps: string[];
    }
  >();

  packageJSONs.forEach(({ path, content }) => {
    depsMap.set(content.name, {
      path,
      deps: getWorkspaceDeps(content),
    });
  });

  const isCyclic = (name: string) => {
    let isCyclic = false;
    const history = new Set();
    const search = (depName: string) => {
      if (history.has(depName)) {
        return;
      }
      history.add(depName);
      if (depName === name) {
        isCyclic = true;
      } else {
        depsMap.get(depName)?.deps.forEach(search);
      }
    };
    depsMap.get(name)?.deps.forEach(search);

    return isCyclic;
  };

  const cyclicPackages = Array.from(depsMap.keys()).filter(isCyclic);

  if (cyclicPackages.length) {
    failed = true;
    const name = chalk.yellow(
      'Lint "no-cyclic-workspace-dependencies" failed.',
    );
    logger.error(`${name}
Find cyclic workspace dependencies in following packages:
 - ${cyclicPackages.join('\n - ')}`);
  }

  return failed;
}
