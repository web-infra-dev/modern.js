/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import os from 'os';
import glob from 'glob';

const kProjectDir = path.resolve(__dirname, '../../../');
const kRoot =
  os.platform() === 'win32' ? process.cwd().split(path.sep)[0] : '/';
const kWorkspace = new Map<string, Set<string>>();
const folders: { name: string; path: string }[] = [];

function rushCheck(file: string) {
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

  if (c.name.startsWith('@modern-js')) {
    folders.push({
      name: c.name,
      path: path.dirname(file),
    });
  }

  const { dependencies = {}, devDependencies = {} } = c;
  for (const key of Object.keys(dependencies)) {
    if (!kWorkspace.has(key)) {
      kWorkspace.set(key, new Set<string>());
    }
    kWorkspace.get(key)?.add(dependencies[key]);
  }
  for (const key of Object.keys(devDependencies)) {
    if (!kWorkspace.has(key)) {
      kWorkspace.set(key, new Set<string>());
    }
    kWorkspace.get(key)?.add(devDependencies[key]);
  }
}

function main() {
  const files = glob.sync('**/package.json', {
    cwd: kProjectDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/fixtures/**'],
  });
  files.forEach(rushCheck);

  // sort by name
  folders.sort((a, b) => a.name.localeCompare(b.name));
  console.log(JSON.stringify(folders, null, 2));

  // for (const [key, set] of kWorkspace) {
  //   const arr = Array.from(set);
  //   if (arr.length > 1) {
  //     arr.sort();
  //     console.log(`${key}: ${arr.join(', ')}`);
  //   }
  // }
}

main();

/* eslint-enable @typescript-eslint/no-unused-vars */
/* eslint-enable no-console */
