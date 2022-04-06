/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import os from 'os';
import glob from 'glob';

const kProjectDir = path.resolve(__dirname, '../../../');
const kRoot =
  os.platform() === 'win32' ? process.cwd().split(path.sep)[0] : '/';
const kWorkspace = new Map<string, string>();

function resolveSourceFile(str: string): string {
  if (!str.startsWith('./dist/js/')) {
    return str;
  }

  // ./dist/js/node/cli/index.js
  // ./dist/js/treeshaking/runtime/index.js
  // ./dist/js/modern/runtime/index.js
  // 逻辑是删除 ./dist/js/[\w] 的这部分前缀，然后后缀名改成 ts
  const file = str.replace(/^\.\/dist\/js\/\w+\//, '').replace(/\.js$/, '.ts');
  return `./src/${file}`;
}

// eslint-disable-next-line max-statements
function processFile(file: string): void {
  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  if (c.main && typeof c.main === 'string') {
    // 如果 exports 存在，那么就默认覆盖了 main 的设置，此时 main 这个字段其实是没有任何意义的
    // 所以把它改成源码所指向的文件，方便 vscode 开发的时候识别出来
    const oldValue = c.main;
    const newValue = resolveSourceFile(oldValue);
    if (c.exports) {
      c.main = newValue;
      if (c['jsnext:source'] && c['jsnext:source'] !== c.main) {
        c['jsnext:source'] = c.main;
      }
    } else {
      c.main = newValue;
      c.exports = {
        '.': {
          'jsnext:source': resolveSourceFile(oldValue),
          default: oldValue,
        },
      };
    }
    delete c.types;
  }

  delete c.typesVersions;

  // add './src/index.ts' to c.exports['.'].node.source attribute
  if (c.exports) {
    if (c.exports['.']) {
      if (c.exports['.'].node) {
        const n = c.exports['.'].node;
        if (typeof n === 'string') {
          c.exports['.'].node = {
            'jsnext:source': resolveSourceFile(n),
            default: n,
          };
        } else {
          const z = n.require || n.import;
          c.exports['.'].node = {
            'jsnext:source': z ? resolveSourceFile(z) : './src/index.ts',
            ...n,
          };
        }
      } else {
        c.exports['.'].node = {
          'jsnext:source': './src/index.ts',
        };
      }
    } else {
      c.exports['.'] = {
        node: {
          'jsnext:source': './src/index.ts',
        },
      };
    }
    // 处理其他的 subpath exports
    Object.keys(c.exports).forEach(key => {
      if (!key.startsWith('./')) {
        // 可能是：'.' / import / require / node / default
        // 忽略就好了
        return;
      }

      const value = c.exports[key];
      if (typeof value === 'string') {
        if (key === './package.json') {
          return;
        }
        if (key === './bin' && c.name === '@modern-js/core') {
          c.exports[key] = {
            'jsnext:source': './src/cli.ts',
            default: value,
          };
          return;
        }
        c.exports[key] = {
          'jsnext:source': resolveSourceFile(value),
          default: value,
        };
      } else {
        c.exports[key] = {
          'jsnext:source': resolveSourceFile(value.default || value.node),
          ...value,
        };
      }
    });
  }

  fs.writeFileSync(p, `${JSON.stringify(c, null, 2)}\n`);
}

function getPackageRoot(f: string): string {
  let packageRoot = path.dirname(f);
  while (packageRoot !== kRoot) {
    if (
      fs.existsSync(`${packageRoot}/package.json`) &&
      fs.existsSync(`${packageRoot}/tsconfig.json`)
    ) {
      return packageRoot;
    }
    packageRoot = path.dirname(packageRoot);
  }
  return '';
}

function addPublishConfig(file: string): void {
  if (!file.startsWith('packages/')) {
    return;
  }

  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  if (c.publishConfig) {
    c.publishConfig.main = c.main;
  } else {
    c.publishConfig = {
      registry: 'https://registry.npmjs.org/',
      access: 'public',
      main: c.main,
    };
  }

  c.main = c['jsnext:source'];
  if (c.main) {
    const mainFile = path.join(path.dirname(p), c.main);
    if (!fs.existsSync(mainFile)) {
      console.error(file);
    }
  } else {
    console.error(file);
  }

  fs.writeFileSync(p, `${JSON.stringify(c, null, 2)}\n`);
}

function restoreTsAlias(f: string): void {
  console.log(f);
  if (f.endsWith('.d.ts')) {
    return;
  }

  const p = `${kProjectDir}/${f}`;
  const d = fs.readFileSync(p, 'utf8');

  const modules = new Set<string>();
  const content = d;
  const pattern1 = /^import\s+([^\\0]*?)\s+from\s+(['"])([^'"]+)(['"])/gm;
  const pattern2 = /^import\s+['"]([^'"]+)['"]/g;
  let match: any;
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern1.exec(content))) {
    modules.add(match[3]);
  }
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern2.exec(content))) {
    modules.add(match[1]);
  }

  const z = [...modules.values()].filter(v => v.startsWith('@/'));
  if (z.length) {
    const packageRoot = getPackageRoot(p);
    // console.log(p);
    let code = d;
    z.forEach(moduleId => {
      // replace ts alias moduleId to file relative path
      const modulePath = path.resolve(
        packageRoot,
        moduleId.replace(/^@\//, 'src/'),
      );
      const relativePath = path.relative(path.dirname(p), modulePath);
      // console.log(`${moduleId} -> ${modulePath} -> ${relativePath}`);
      code = code.replace(moduleId, relativePath);
    });
    fs.writeFileSync(p, code);
  }
}

function getWorkspacePackages(file: string) {
  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  const { name, version } = c;
  if (name && version) {
    kWorkspace.set(name, version);
  }
}

function fixWorkspacePackagesVersions(file: string) {
  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  const ignoredPkg = new Set<string>([
    '@scripts/build',
    '@scripts/jest-config',
  ]);

  const { dependencies = {}, devDependencies = {} } = c;
  for (const key of Object.keys(dependencies)) {
    if (kWorkspace.has(key) && !ignoredPkg.has(key)) {
      dependencies[key] = `workspace:^${kWorkspace.get(key)!}`;
    }
  }
  for (const key of Object.keys(devDependencies)) {
    if (kWorkspace.has(key) && !ignoredPkg.has(key)) {
      devDependencies[key] = `workspace:^${kWorkspace.get(key)!}`;
    }
  }

  fs.writeFileSync(p, `${JSON.stringify(c, null, 2)}\n`);
}

// eslint-disable-next-line max-statements
function fixPluginTesting(file: string) {
  if (!file.startsWith('packages/')) {
    return;
  }

  // "@modern-js/plugin-testing": "workspace:^1.2.2",
  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  const { devDependencies = {} } = c;
  if (devDependencies['@modern-js/plugin-testing']) {
    delete devDependencies['@modern-js/plugin-testing'];
    devDependencies.jest = '^27';
    devDependencies['@scripts/jest-config'] = 'workspace:*';

    if (c.scripts) {
      c.scripts.test = 'jest --passWithNoTests';
    } else {
      c.scripts = {
        test: 'jest --passWithNoTests',
      };
    }
  }

  fs.writeFileSync(p, `${JSON.stringify(c, null, 2)}\n`);

  // 复制 packages/cli/core/jest.config.js 文件
  const dstFile = path.join(path.dirname(p), 'jest.config.js');
  if (!fs.existsSync(dstFile)) {
    const srcFile = path.join(kProjectDir, 'packages/cli/core/jest.config.js');
    fs.writeFileSync(dstFile, fs.readFileSync(srcFile, 'utf8'));
  }
}

function fixTypesField(file: string) {
  if (!file.startsWith('packages/')) {
    return;
  }

  const p = `${kProjectDir}/${file}`;
  const d = fs.readFileSync(p, 'utf8');
  let c: any;
  try {
    c = JSON.parse(d);
  } catch (e) {
    return;
  }

  const { types, publishConfig, main } = c;
  if (publishConfig?.main) {
    // 恢复之前的 main 配置
    c.main = publishConfig.main;
    delete publishConfig.main;
  }
  if (publishConfig && types) {
    // 把之前的 types 记录下来
    publishConfig.types = types;
  }
  if (main) {
    // 设置 ./src/index.ts 给 types 字段，让 vscode 找到文件
    c.types = main;
  }

  fs.writeFileSync(p, `${JSON.stringify(c, null, 2)}\n`);
}

function main() {
  const files = glob.sync('**/package.json', {
    cwd: kProjectDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/fixtures/**'],
  });
  // files.forEach(fixTypesField);
  files.forEach(getWorkspacePackages);
  files.forEach(fixWorkspacePackagesVersions);
  // files.forEach(addPublishConfig);
  // console.log([...kWorkspace]);

  // const tsfiles = glob.sync('**/*.ts', {
  //   cwd: kProjectDir,
  //   nodir: true,
  //   ignore: ['**/node_modules/**', '**/dist/**'],
  // });
  // tsfiles.forEach(restoreTsAlias);
}

main();

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable no-console */
