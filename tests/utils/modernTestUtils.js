const path = require('path');
const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const getRandomPort = require('get-port');
const { launchOptions } = require('./launchOptions');

const kModernAppTools = path.join(
  __dirname,
  '../node_modules/@modern-js/app-tools/bin/modern.js',
);

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
    let allOutput = '';

    function handleStderr(data) {
      const message = data.toString();
      allOutput += message;
      if (stdOut !== false && options.stdout !== false) {
        process.stderr.write(message);
      }
    }

    function handleStdout(data) {
      const message = data.toString();
      allOutput += message;

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
    instance.stderr.on('data', handleStderr);

    instance.on('error', error => {
      reject(error);
    });

    instance.on('close', code => {
      instance.stdout.removeListener('data', handleStdout);
      instance.stderr.removeListener('data', handleStderr);
      if (!didResolve) {
        didResolve = true;
        // The process died before it ever became ready. Swallowing this as
        // a silent `resolve(undefined)` used to surface later as confusing
        // connection failures — fail loudly with the real output instead.
        reject(
          new Error(
            `process exited (code ${code}) before it was ready:\n${allOutput}`,
          ),
        );
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
        reject(new Error(message));
      }

      if (marker?.test(message)) {
        resolve({
          code: 0,
          stdout: stdoutOutput,
        });
        await killApp(instance);
      }
    });
    // }

    instance.on('close', code => {
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

async function modernBuild(dir, args = [], opts = {}) {
  const result = await runModernCommand(['build', ...args], {
    ...opts,
    cwd: dir,
    stdout: true,
    stderr: true,
    env: {
      NODE_ENV: 'production',
      ...(opts.env || {}),
    },
  });
  // A failed build must fail the test instead of leaking a `code: 1` that
  // most callers never check; pass `allowFailure: true` to inspect it.
  if (result.code !== 0 && !opts.allowFailure) {
    throw new Error(
      `modern build exited with code ${result.code}:\n${result.stdout || ''}\n${result.stderr || ''}`,
    );
  }
  return result;
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
  if (!instance) {
    // Nothing to kill; without this the code below would still call
    // treeKill(undefined.pid).
    return;
  }

  // Wait for the process to actually exit, not just for the kill signal to
  // be sent: a dev server removes its lock file on the way out, and a build
  // started right after killApp() must not race that cleanup.
  const closed =
    instance.exitCode !== null || instance.signalCode
      ? Promise.resolve()
      : new Promise(resolve => {
          instance.once('close', resolve);
          setTimeout(resolve, 10_000).unref?.();
        });

  await new Promise((resolve, reject) => {
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

  await closed;
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
 * that used to share one project directory each run against their own copy —
 * required since concurrent dev/build in the same directory is rejected by
 * the dev server lock (and was silently corrupting artifacts before it).
 *
 * node_modules is NOT symlinked as a whole: a whole-dir link would make all
 * copies share `node_modules/.cache` (the lock registry) and
 * `node_modules/.modern-js` (generated code), re-creating the conflict.
 * Every entry is linked individually instead, and those two are left out so
 * each copy gets its own.
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
