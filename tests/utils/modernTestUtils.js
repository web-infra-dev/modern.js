const path = require('path');
const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const getRandomPort = require('get-port');
const { launchOptions } = require('./launchOptions');

const kModernAppTools = path.join(
  __dirname,
  '../node_modules/@modern-js/app-tools/bin/modern.js',
);

// A syntax error raised while Node compiles a generated module names neither
// the file nor the line once the CLI has caught and re-logged it. The generated
// code is the only part that differs per platform, so parse what was written
// under `.modern-js` and let node report the offending file itself.
function reportUnparsableGeneratedCode(cwd) {
  if (!cwd) {
    return;
  }
  const fs = require('fs');
  const os = require('os');
  const { execFileSync } = require('child_process');
  // Generated entries land in `.modern-js`, transpiled configs in `.cache`, so
  // walk `node_modules` itself. Installed packages are pnpm symlinks and
  // `isDirectory()` is false for those, so the walk stays inside what this run
  // actually wrote instead of descending into the store.
  const root = path.join(cwd, 'node_modules');

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
      } else if (/\.(js|jsx|mjs)$/.test(entry.name)) {
        files.push(target);
      }
    }
  };
  collect(root);

  if (!files.length) {
    console.error(`[generated-code] nothing to parse under ${root}`);
    return;
  }

  // `node --check` parses a `.js` file as CommonJS, which silently accepts the
  // ESM-only breakage we are looking for. Check a `.mjs` copy instead so the
  // parser applies module semantics, exactly like the failing loader did.
  let isEsm = false;
  try {
    isEsm =
      JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'))
        .type === 'module';
  } catch {}

  let broken = 0;
  for (const file of files) {
    let target = file;
    if (isEsm && !file.endsWith('.mjs')) {
      target = path.join(
        os.tmpdir(),
        `modern-parse-${process.pid}-${broken}-${path.basename(file)}.mjs`,
      );
      try {
        fs.copyFileSync(file, target);
      } catch {
        target = file;
      }
    }
    try {
      execFileSync(process.execPath, ['--check', target], { stdio: 'pipe' });
    } catch (error) {
      broken += 1;
      console.error(
        `[generated-code] ${file} does not parse:\n${error.stderr || error.message}`,
      );
    } finally {
      if (target !== file) {
        try {
          fs.unlinkSync(target);
        } catch {}
      }
    }
  }
  console.error(
    `[generated-code] parsed ${files.length} generated file(s) under ${root}, ${broken} unparsable`,
  );
}

function runContinuousTask(argv, stdOut, options = {}) {
  const { cwd } = options;
  const env = {
    ...process.env,
    ...options.env,
  };

  return new Promise((resolve, reject) => {
    const instance = spawn(process.execPath, argv, {
      cwd,
      env,
    });

    let didResolve = false;

    // stderr is not part of the ready/error markers, but it is where a crashing
    // app prints why it died. Without collecting it, a dev server that never
    // boots leaves no trace and the test fails later with a misleading
    // ERR_CONNECTION_REFUSED.
    let stderrOutput = '';
    instance.stderr?.on('data', data => {
      stderrOutput += data.toString();
    });

    function handleStdout(data) {
      const message = data.toString();

      if (options.errorMessage?.test(message)) {
        if (!didResolve) {
          didResolve = true;
          reject(new Error(message));
        }
      }

      if (options.waitMessage.test(message)) {
        if (!didResolve) {
          didResolve = true;
          resolve(stdOut ? message : instance);
        }
      }

      if (typeof options.onStdout === 'function') {
        options.onStdout(message);
      }

      if (stdOut !== false && options.stdout !== false) {
        process.stdout.write(message);
      }
    }

    instance.stdout.on('data', handleStdout);

    instance.on('error', error => {
      reject(error);
    });

    instance.on('close', code => {
      instance.stdout.removeListener('data', handleStdout);
      if (!didResolve) {
        didResolve = true;
        // Exited before it was ever ready — report it here, otherwise the only
        // symptom is a connection refused in whatever assertion runs next.
        console.error(
          `[runContinuousTask] "${argv.join(' ')}" exited with code ${code} before becoming ready${
            stderrOutput ? `\n${stderrOutput}` : ''
          }`,
        );
        reportUnparsableGeneratedCode(cwd);
        resolve();
      }
    });
  });
}

function runModernCommand(argv, options = {}) {
  const { cwd, rejectOnCompileError = true } = options;
  const cmd = argv[0];
  const env = {
    ...process.env,
    ...options.env,
  };

  return new Promise((resolve, reject) => {
    const instance = spawn(process.execPath, [kModernAppTools, ...argv], {
      ...options.spawnOptions,
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (typeof options.instance === 'function') {
      options.instance(instance);
    }

    // Set once the promise has been settled by a marker, so the close handler
    // can tell an unexpected exit from an already-reported one.
    let settled = false;

    let stderrOutput = '';
    if (options.stderr) {
      instance.stderr.on('data', chunk => {
        stderrOutput += chunk;
      });
    }

    let stdoutOutput = '';
    // if (options.stdout) {
    instance.stdout.on('data', async chunk => {
      let { marker } = options;
      if (cmd === 'deploy') {
        marker = /end deploy!/i;
      }
      stdoutOutput += chunk;
      const message = chunk.toString();

      const compileErrorMarker = /Compile error/i;

      if (
        cmd === 'build' &&
        rejectOnCompileError &&
        compileErrorMarker.test(message)
      ) {
        settled = true;
        reject(new Error(message));
      }

      if (marker?.test(message)) {
        settled = true;
        resolve({
          code: 0,
          stdout: stdoutOutput,
        });
        await killApp(instance);
      }
    });
    // }

    instance.on('close', code => {
      // A non-zero exit that never printed "Compile error" resolves like a
      // success here, and callers rarely check `code`. Report it, otherwise the
      // only symptom is a missing-artifact assertion further down the test.
      if (!settled && code !== 0) {
        console.error(
          `[runModernCommand] "${cmd}" exited with code ${code}${
            stdoutOutput ? `\n${stdoutOutput}` : ''
          }${stderrOutput ? `\n${stderrOutput}` : ''}`,
        );
        reportUnparsableGeneratedCode(cwd);
      }
      resolve({
        code,
        stdout: stdoutOutput,
        stderr: stderrOutput,
      });
    });

    instance.on('error', err => {
      err.stdout = stdoutOutput;
      err.stderr = stderrOutput;
      reject(err);
    });
  });
}

function runModernCommandDev(argv, stdOut, options = {}) {
  const { rejectOnCompileError = true } = options;

  const bootupMarkers = {
    dev: /> Local:/i,
    serve: /> Local:/i,
  };
  const compileErrorMarker = /Compile error/i;

  const errorMessage = rejectOnCompileError ? compileErrorMarker : undefined;

  return runContinuousTask([kModernAppTools, ...argv], stdOut, {
    ...options,
    waitMessage: bootupMarkers[options.modernServe ? 'serve' : 'dev'],
    errorMessage,
  });
}

function modernBuild(dir, args = [], opts = {}) {
  return runModernCommand(['build', ...args], {
    ...opts,
    cwd: dir,
    stdout: true,
    stderr: true,
    env: {
      NODE_ENV: 'production',
      ...(opts.env || {}),
    },
  });
}

function modernDeploy(dir, mode = '', opts = {}) {
  return runModernCommand(['deploy', `--dir=${dir}`, `--mode=${mode}`], {
    ...opts,
    stdout: true,
    cwd: dir,
    env: {
      NODE_ENV: 'production',
      BUILD_PATH: '',
    },
    cmd: 'deploy',
  });
}

function launchApp(dir, port, opts = {}, env = {}) {
  return runModernCommandDev(['dev'], undefined, {
    ...opts,
    cwd: dir,
    env: {
      PORT: port,
      NODE_ENV: 'development',
      ...env,
    },
  });
}

function modernServe(dir, port, opts = {}) {
  return runModernCommandDev(['serve'], undefined, {
    cwd: dir,
    env: {
      PORT: port,
      NODE_ENV: 'production',
    },
    modernServe: true,
    ...opts,
  });
}

async function killApp(instance, ignoreError = false) {
  await new Promise((resolve, reject) => {
    if (!instance) {
      resolve();
    }

    treeKill(instance.pid, err => {
      if (err) {
        if (
          process.platform === 'win32' &&
          typeof err.message === 'string' &&
          (err.message.includes(`no running instance of the task`) ||
            err.message.includes(`not found`))
        ) {
          // Windows throws an error if the process is already dead
          //
          // Command failed: taskkill /pid 6924 /T /F
          // ERROR: The process with PID 6924 (child process of PID 6736) could not be terminated.
          // Reason: There is no running instance of the task.
          return resolve();
        }
        if (!ignoreError) {
          return reject(err);
        }
      }
      return resolve();
    });
  });
}

const portMap = new Map();

async function getPort() {
  while (true) {
    const port = await getRandomPort();
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    }
  }
}

function sleep(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}

/**
 * Copy a fixture app into a unique temporary sibling directory so test files
 * that would otherwise share one project directory each run against their own
 * copy. Concurrent build/dev in a single directory corrupts artifacts: the
 * build empties `dist` under the running server.
 *
 * node_modules is NOT symlinked as a whole: a whole-dir link would make all
 * copies share `node_modules/.modern-js` (generated code), re-creating the
 * conflict. Every entry is linked individually instead, and `.cache` /
 * `.modern-js` are left out so each copy gets its own.
 */
async function createIsolatedTestApp(sourceAppDir, options = {}) {
  const fse = require('fs-extra');
  const { prefix = `.isolated-${path.basename(sourceAppDir)}-`, exclude = [] } =
    options;

  const appDir = await fse.mkdtemp(
    path.join(path.dirname(sourceAppDir), prefix),
  );
  const topLevelExcludes = [
    'node_modules',
    'dist',
    'dist-deploy',
    'dist-ssg',
    '.output',
    'tests',
    'test',
    ...exclude,
  ];
  await fse.copy(sourceAppDir, appDir, {
    filter: src => {
      const relative = path.relative(sourceAppDir, src);
      if (!relative) {
        return true;
      }
      const [firstSegment] = relative.split(path.sep);
      return !topLevelExcludes.includes(firstSegment);
    },
  });

  const sourceNodeModules = path.join(sourceAppDir, 'node_modules');
  const appNodeModules = path.join(appDir, 'node_modules');
  await fse.ensureDir(appNodeModules);
  if (await fse.pathExists(sourceNodeModules)) {
    for (const entry of await fse.readdir(sourceNodeModules)) {
      if (entry === '.cache' || entry === '.modern-js') {
        continue;
      }
      const target = path.join(sourceNodeModules, entry);
      // stat (not lstat): pnpm's top-level entries are themselves symlinks,
      // and the link type must describe what they finally point to.
      let isDirectory = true;
      try {
        isDirectory = (await fse.stat(target)).isDirectory();
      } catch {
        continue; // dangling link in the source tree
      }
      await fse.ensureSymlink(
        target,
        path.join(appNodeModules, entry),
        isDirectory ? 'junction' : 'file',
      );
    }
  }

  return {
    appDir,
    // Callers must kill any process using appDir before cleanup; removal is
    // retried because Windows keeps directories busy while children exit.
    async cleanup() {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await fse.remove(appDir);
          return;
        } catch {
          await sleep(500);
        }
      }
      await fse.remove(appDir).catch(() => {});
    },
  };
}

module.exports = {
  runContinuousTask,
  runModernCommand,
  runModernCommandDev,
  modernBuild,
  modernDeploy,
  modernServe,
  launchApp,
  killApp,
  getPort,
  sleep,
  launchOptions,
  createIsolatedTestApp,
};
