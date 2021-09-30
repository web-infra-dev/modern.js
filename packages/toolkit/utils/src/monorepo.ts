import fs from 'fs';
import path from 'path';
import glob from 'glob';
import yaml from 'yaml';

const PACKAGE_MAX_DEPTH = 5;

const WOKRSPACES_FILES = {
  YARN: 'package.json',
  PNPM: 'pnpm-workspaces.yaml',
  LERNA: 'lerna.json',
};

export const isLerna = (root: string) =>
  fs.existsSync(path.join(root, WOKRSPACES_FILES.LERNA));

export const isYarnWorkspaces = (root: string) => {
  const pkg = path.join(root, WOKRSPACES_FILES.YARN);

  if (!fs.existsSync(pkg)) {
    return false;
  }

  const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));

  return Boolean(json.workspaces?.packages);
};

export const isPnpmWorkspaces = (root: string) =>
  fs.existsSync(path.join(root, WOKRSPACES_FILES.PNPM));

export const isMonorepo = (root: string) =>
  isLerna(root) || isYarnWorkspaces(root) || isPnpmWorkspaces(root);

export const isModernjsMonorepo = (root: string) => {
  const json = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );

  const deps = {
    ...(json.dependencies || {}),
    ...(json.devDependencies || {}),
  };

  return Boolean(deps['@modern-js/monorepo-tools']);
};

export const findMonorepoRoot = (
  appDirectory: string,
  maxDepth: number = PACKAGE_MAX_DEPTH,
) => {
  let inMonorepo = false;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (isMonorepo(appDirectory)) {
      inMonorepo = true;
      break;
    }
    // eslint-disable-next-line no-param-reassign
    appDirectory = path.dirname(appDirectory);
  }

  return inMonorepo ? appDirectory : undefined;
};

export const getMonorepoPackages = (
  root: string,
): { name: string; path: string }[] => {
  let packages: string[] = [];

  if (isYarnWorkspaces(root)) {
    const json = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    ({ packages } = json.workspaces);
  } else if (isLerna(root)) {
    const json = JSON.parse(
      fs.readFileSync(path.resolve(root, 'lerna.json'), 'utf8'),
    );
    ({ packages } = json);
  } else {
    ({ packages } = yaml.parse(
      fs.readFileSync(path.join(root, WOKRSPACES_FILES.PNPM), 'utf8'),
    ));
  }

  if (packages) {
    return packages
      .map(name =>
        // The trailing / ensures only dirs are picked up
        glob.sync(path.join(root, `${name}/`), {
          ignore: ['**/node_modules/**'],
        }),
      )
      .flat()
      .filter(filepath => fs.existsSync(path.resolve(filepath, 'package.json')))
      .map(filepath => ({
        path: filepath,
        name: JSON.parse(
          fs.readFileSync(path.resolve(filepath, 'package.json'), 'utf8'),
        ).name,
      }));
  }

  return [];
};
