/**
 * Copyright (c) 2021 Vercel, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/vercel/next.js/blob/canary/skip-docs-change.js
 */
const { promisify } = require('util');
const { exec: execOrig, spawn } = require('child_process');

const exec = promisify(execOrig);

const DOCS_FOLDERS = [
  '.changeset',
  '.github',
  '.vscode',
  'website',
  'scripts/skip-docs-change.js',
];

async function main() {
  await exec('git fetch origin main');

  const { stdout: changedFilesOutput } = await exec(
    'git diff origin/main... --name-only',
  );
  const changedFiles = changedFilesOutput
    .split('\n')
    .map(file => file && file.trim())
    .filter(Boolean);

  const hasNonDocsChange =
    !changedFiles.length ||
    changedFiles.some(
      file =>
        !DOCS_FOLDERS.some(
          folder =>
            file.startsWith(`${folder}/`) ||
            file === folder ||
            file.endsWith('.md'),
        ),
    );

  const args = process.argv.slice(process.argv.indexOf(__filename) + 1);

  if (args.length === 0) {
    // eslint-disable-next-line no-console
    console.log(process.argv, args);
    // eslint-disable-next-line no-console
    console.log('no script provided, exiting...');
  }

  if (hasNonDocsChange) {
    const cmd = spawn(args[0], args.slice(1));
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);

    await new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      cmd.on('exit', code => {
        if (code !== 0) {
          return reject(new Error(`command failed with code: ${code}`));
        }
        resolve();
      });
      cmd.on('error', err => reject(err));
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('docs only change');
  }
}

main().catch(err => {
  console.error('Failed to detect doc changes', err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
