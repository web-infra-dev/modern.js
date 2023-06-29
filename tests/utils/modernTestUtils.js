const path = require('path');
const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const getRandomPort = require('get-port');
const { launchOptions } = require('./launchOptions');

const kModernAppTools = path.join(
  __dirname,
  '../node_modules/@modern-js/app-tools/bin/modern.js',
);

function runModernCommand(argv, options = {}) {
  const { cwd } = options;
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
      if (marker && marker.test(message)) {
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
  const { cwd } = options;
  const env = {
    ...process.env,
    ...options.env,
  };

  return new Promise((resolve, reject) => {
    const instance = spawn(process.execPath, [kModernAppTools, ...argv], {
      cwd,
      env,
    });

    let didResolve = false;

    function handleStdout(data) {
      const message = data.toString();
      const bootupMarkers = {
        dev: /(App|Dev server|Preview server) running at/i,
        serve: /(App|Dev server|Preview server) running at/i,
      };
      if (bootupMarkers[options.modernServe ? 'serve' : 'dev'].test(message)) {
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

module.exports = {
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
};
