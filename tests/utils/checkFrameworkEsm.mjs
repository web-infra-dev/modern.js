// Parses every `.mjs` the framework publishes, without running any of it.
//
// A project with `"type": "module"` loads the framework from `dist/esm-node`,
// a CommonJS one from `dist/cjs`. When only the ESM projects die at startup
// with a syntax error the ESM build is the suspect, but the loader reports
// neither the file nor the line, so parse the whole build and name it here.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = process.argv[2];
const files = [];

const collect = dir => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(target);
    } else if (entry.name.endsWith('.mjs')) {
      files.push(target);
    }
  }
};

// Packages are laid out as `packages/<category>/<package>`.
const packagesDir = path.join(repoRoot, 'packages');
for (const category of fs.readdirSync(packagesDir, { withFileTypes: true })) {
  if (!category.isDirectory()) {
    continue;
  }
  const categoryDir = path.join(packagesDir, category.name);
  for (const pkg of fs.readdirSync(categoryDir, { withFileTypes: true })) {
    if (pkg.isDirectory()) {
      collect(path.join(categoryDir, pkg.name, 'dist', 'esm-node'));
    }
  }
}

let broken = 0;
for (const file of files) {
  try {
    // Constructing the module parses it; it is never linked or evaluated.
    new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), {
      identifier: file,
    });
  } catch (error) {
    broken += 1;
    console.error(`[framework-esm] ${file} does not parse: ${error.message}`);
  }
}
console.error(
  `[framework-esm] parsed ${files.length} framework .mjs file(s), ${broken} unparsable`,
);
