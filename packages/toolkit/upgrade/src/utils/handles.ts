import path from 'path';
import { fs } from '@modern-js/utils';

/**
 * Add `strict-peer-dependencies=false` to .npmrc
 * @param rootPath project root path
 */
export const handleNpmrc = async (rootPath: string) => {
  const npmrcPath = path.join(rootPath, '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    const content = fs.readFileSync(npmrcPath, 'utf-8');
    if (!content.includes('strict-peer-dependencies=false')) {
      fs.appendFileSync(npmrcPath, '\nstrict-peer-dependencies=false\n');
    }
  } else {
    fs.ensureFileSync(npmrcPath);
    fs.writeFileSync(npmrcPath, 'strict-peer-dependencies=false');
  }
};

/**
 * Update husky to v8
 * @param rootPath
 * @param pkgJson
 * @returns
 */
export const handleHuskyV8 = (
  rootPath: string,
  pkgJson: Record<string, any>,
) => {
  const huskyVersion = pkgJson?.devDependencies?.husky;

  if (!huskyVersion) {
    return;
  }
  const major = huskyVersion.match(/(\d+)\./)![1];

  if (major === '8') {
    return;
  }
  // Update husky version to ^8.0.0
  pkgJson.devDependencies.husky = '^8.0.0';
  // Update prepare scripts
  const { prepare } = pkgJson.scripts;
  if (!prepare) {
    pkgJson.scripts.prepare = 'husky install';
  } else if (!prepare.includes('husky install')) {
    pkgJson.scripts.prepare = `${prepare} && husky install`;
  }
  pkgJson.husky = undefined;

  // .husky/pre-commit
  const huskyPath = path.join(rootPath, '.husky');
  const preCommitPath = path.join(huskyPath, 'pre-commit');
  fs.ensureDirSync(huskyPath);
  fs.writeFileSync(
    path.join(preCommitPath),
    fs.readFileSync(path.join(__dirname, '../../templates/pre-commit'), {
      encoding: 'utf-8',
    }),
  );
  fs.chmodSync(preCommitPath, '755');
};
