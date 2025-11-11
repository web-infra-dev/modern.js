#!/usr/bin/env node

/**
 * Module Federation Test Runner
 * Properly orchestrates startup of remotes before hosts
 */

const path = require('path');
const { spawn } = require('child_process');
const { getPort, killApp } = require('../utils/modernTestUtils');

// Configuration for the test apps
const TEST_APPS = {
  remotes: [
    {
      name: 'rsc-csr-mf',
      dir: path.resolve(__dirname, 'rsc-csr-mf'),
      envKey: 'RSC_CSR_REMOTE_URL',
    },
    {
      name: 'rsc-ssr-mf',
      dir: path.resolve(__dirname, 'rsc-ssr-mf'),
      envKey: 'RSC_SSR_REMOTE_URL',
    },
  ],
  hosts: [
    {
      name: 'rsc-csr-mf-host',
      dir: path.resolve(__dirname, 'rsc-csr-mf-host'),
      remoteEnvKey: 'RSC_CSR_REMOTE_URL',
    },
    {
      name: 'rsc-ssr-mf-host',
      dir: path.resolve(__dirname, 'rsc-ssr-mf-host'),
      remoteEnvKey: 'RSC_SSR_REMOTE_URL',
    },
  ],
};

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  console.log(`Waiting for server at ${url}...`);

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 404) {
        console.log(`Server at ${url} is ready!`);
        return true;
      }
    } catch (err) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

async function buildProject(dir, bundler = 'webpack', env = {}) {
  console.log(`Building ${path.basename(dir)}...`);

  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['run', 'build'], {
      cwd: dir,
      env: {
        ...process.env,
        BUNDLER: bundler,
        NODE_ENV: 'production',
        ...env,
      },
      stdio: 'inherit',
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed for ${dir}`));
      }
    });

    child.on('error', reject);
  });
}

async function serveProject(dir, port, env = {}) {
  console.log(`Starting server for ${path.basename(dir)} on port ${port}...`);

  const child = spawn('pnpm', ['run', 'serve'], {
    cwd: dir,
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: 'production',
      MODERN_MF_AUTO_CORS: '1',
      ...env,
    },
    stdio: 'inherit',
  });

  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  return child;
}

async function runTests() {
  const servers = [];
  const remoteUrls = {};

  try {
    // Step 1: Build all remotes first
    console.log('\n=== Building Remote Applications ===\n');
    for (const remote of TEST_APPS.remotes) {
      await buildProject(remote.dir);
    }

    // Step 2: Start all remotes
    console.log('\n=== Starting Remote Servers ===\n');
    for (const remote of TEST_APPS.remotes) {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      const server = await serveProject(remote.dir, port, {
        ASSET_PREFIX: url,
      });

      servers.push(server);
      remoteUrls[remote.envKey] = url;

      // Wait for remote to be ready
      await waitForServer(`${url}/static/mf-manifest.json`);
      console.log(`✅ ${remote.name} is ready at ${url}`);
    }

    // Step 3: Build all hosts with remote URLs
  console.log('\n=== Building Host Applications ===\n');
  for (const host of TEST_APPS.hosts) {
    const remoteUrl = remoteUrls[host.remoteEnvKey];

    await buildProject(host.dir, 'webpack', {
      REMOTE_URL: remoteUrl,
      MODERN_MF_AUTO_CORS: '1',
    });
    console.log(`✅ Built ${host.name} with REMOTE_URL=${remoteUrl}`);
  }

    // Step 4: Run the actual tests with proper environment
    console.log('\n=== Running Tests ===\n');

    const testEnv = {
      ...process.env,
      RSC_CSR_REMOTE_URL: remoteUrls.RSC_CSR_REMOTE_URL,
      RSC_SSR_REMOTE_URL: remoteUrls.RSC_SSR_REMOTE_URL,
    };

    const testProcess = spawn(
      'pnpm',
      [
        'run',
        'test:framework',
        '--',
        path.resolve(__dirname, 'rsc-csr-mf/tests/index.test.ts'),
        path.resolve(__dirname, 'rsc-csr-mf-host/tests/index.test.ts'),
        path.resolve(__dirname, 'rsc-ssr-mf/tests/index.test.ts'),
        path.resolve(__dirname, 'rsc-ssr-mf-host/tests/index.test.ts'),
        '--runInBand',
        '--no-coverage',
      ],
      {
        cwd: path.resolve(__dirname, '..'),
        env: testEnv,
        stdio: 'inherit',
      },
    );

    await new Promise((resolve, reject) => {
      testProcess.on('exit', code => {
        if (code === 0) {
          console.log('\n✅ All tests passed!');
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });
      testProcess.on('error', reject);
    });
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    process.exit(1);
  } finally {
    // Cleanup: kill all servers
    console.log('\n=== Cleaning up ===\n');
    for (const server of servers) {
      try {
        server.kill('SIGTERM');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
