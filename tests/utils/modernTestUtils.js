const path = require('path');
const fs = require('fs');
// const execa = require('execa');
const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const portfinder = require('portfinder');
const rimraf = require('rimraf');

function runModernCommand(argv, options = {}) {
  const modernDir = path.dirname(
    require.resolve('@modern-js/core/package.json'),
  );
  const modernBin = path.join(modernDir, 'bin/modern-js');

  const { cwd } = options;
  const cmd = argv[0];
  const env = {
    ...process.env,
    ...options.env,
  };

  return new Promise((resolve, reject) => {
    // console.log(`Running command "modern ${argv.join(' ')}"`);
    const instance = spawn('node', [modernBin, ...argv], {
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
      let marker = options.marker || /compiled successfully/i;
      if (cmd === 'deploy') {
        marker = /end deploy!/i;
      }
      stdoutOutput += chunk;
      const message = chunk.toString();
      if (marker.test(message)) {
        resolve({
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
  const modernDir = path.dirname(
    require.resolve('@modern-js/core/package.json'),
  );
  const modernBin = path.join(modernDir, 'bin/modern-js');

  const { cwd } = options;
  const env = {
    ...process.env,
    ...options.env,
  };

  return new Promise((resolve, reject) => {
    const instance = spawn('node', [modernBin, ...argv], { cwd, env });

    let didResolve = false;

    function handleStdout(data) {
      const message = data.toString();
      const bootupMarkers = {
        dev: /App running at/i,
        start: /App running at/i,
      };
      if (bootupMarkers[options.modernStart ? 'start' : 'dev'].test(message)) {
        if (!didResolve) {
          didResolve = true;
          resolve(stdOut ? message : instance);
        }
      }

      if (typeof options.onStdout === 'function') {
        options.onStdout(message);
      }

      if (options.stdout !== false) {
        process.stdout.write(message);
      }
    }

    instance.stdout.on('data', handleStdout);

    instance.on('error', error => {
      reject(error);
    });

    instance.on('close', () => {
      instance.stdout.removeListener('data', handleStdout);
      if (!didResolve) {
        didResolve = true;
        resolve();
      }
    });
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

function launchApp(dir, port, opts = {}) {
  return runModernCommandDev(['dev'], undefined, {
    ...opts,
    cwd: dir,
    env: {
      PORT: port,
      NODE_ENV: 'development',
    },
  });
}

function modernStart(dir, port, opts = {}) {
  return runModernCommandDev(['start'], undefined, {
    ...opts,
    cwd: dir,
    env: {
      PORT: port,
      NODE_ENV: 'production',
    },
    modernStart: true,
  });
}

async function killApp(instance) {
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
        return reject(err);
      }
      return resolve();
    });
  });
}

function markGuardian() {
  /* eslint-disable-next-line no-undef */
  beforeAll(() => {
    // if (!process.env.IS_GUARDIAN) {
    //   throw new Error('[guardian]: should use guardian');
    // }
  });
}

function installDeps(dir) {
  spawn.sync('pnpm', ['install', '--filter', './', '--ignore-scripts'], {
    stdio: 'inherit',
    cwd: dir,
  });
}

function clearBuildDist(dir) {
  // not support nested projects
  const _clearBuildDist = _dir => {
    const isProjectRoot = fs.existsSync(path.join(_dir, 'package.json'));
    if (isProjectRoot) {
      rimraf.sync(path.join(_dir, 'dist'));
    } else {
      const files = fs.readdirSync(_dir);
      files.forEach(f => {
        const curPath = path.join(_dir, f);
        const isDir = fs.statSync(curPath).isDirectory();
        if (f !== 'node_modules' && isDir) {
          _clearBuildDist(curPath);
        }
      });
    }
  };

  _clearBuildDist(dir);
}

async function getPort() {
  return await portfinder.getPortPromise({ port: 8080 });
}

module.exports = {
  runModernCommand,
  runModernCommandDev,
  modernBuild,
  modernDeploy,
  modernStart,
  launchApp,
  killApp,
  markGuardian,
  getPort,
  installDeps,
  clearBuildDist,
};
