/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import os from 'os';
import glob from 'glob';

const kProjectDir = path.resolve(__dirname, '../../');
const kRoot =
  os.platform() === 'win32' ? process.cwd().split(path.sep)[0] : '/';

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

  if (c.main && typeof c.main === 'string' && c.exports) {
    // 如果 exports 存在，那么就默认覆盖了 main 的设置，此时 main 这个字段其实是没有任何意义的
    // 所以把它改成源码所指向的文件，方便 vscode 开发的时候识别出来
    c.main = resolveSourceFile(c.main);
    if (c['jsnext:source'] && c['jsnext:source'] !== c.main) {
      c['jsnext:source'] = c.main;
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

function main() {
  // const files = glob.sync('**/package.json', {
  //   cwd: kProjectDir,
  //   nodir: true,
  //   ignore: ['**/node_modules/**', '**/dist/**'],
  // });
  // files.forEach(processFile);

  const tsfiles = glob.sync('**/*.ts', {
    cwd: kProjectDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
  tsfiles.forEach(restoreTsAlias);
}

main();

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable no-console */
