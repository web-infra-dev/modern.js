/**
 * Module Federation Test Utilities
 * Handles sequential startup of remote and host servers for testing
 */

const {
  launchApp,
  modernBuild,
  modernServe,
  getPort,
} = require('./modernTestUtils');

/**
 * Wait for a server to be ready by checking if it responds to HTTP requests
 */
async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 404) {
        return true;
      }
    } catch (err) {
      // Server not ready yet, continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

/**
 * Start Module Federation remotes before hosts
 * @param {Object} config - Configuration for MF setup
 * @param {Array} config.remotes - Array of remote configurations
 * @param {Array} config.hosts - Array of host configurations
 * @param {string} config.mode - 'dev' or 'build'
 * @param {string} config.bundler - 'webpack' or 'rspack'
 */
async function startModuleFederation(config) {
  const { remotes = [], hosts = [], mode, bundler } = config;
  const servers = {
    remotes: [],
    hosts: [],
  };

  // Start all remotes first
  for (const remote of remotes) {
    const port = await getPort();
    const assetPrefix = `http://localhost:${port}`;

    console.log(`Starting remote ${remote.name} on port ${port}...`);

    if (mode === 'dev') {
      const app = await launchApp(
        remote.dir,
        port,
        {},
        {
          BUNDLER: bundler,
          ASSET_PREFIX: assetPrefix,
        },
      );
      servers.remotes.push({ app, port, name: remote.name, assetPrefix });
    } else {
      // Build first
      await modernBuild(remote.dir, [], {
        env: {
          BUNDLER: bundler,
          ASSET_PREFIX: assetPrefix,
        },
      });

      // Then serve
      const app = await modernServe(remote.dir, port, {
        cwd: remote.dir,
        env: {
          PORT: port,
          NODE_ENV: 'production',
          ASSET_PREFIX: assetPrefix,
        },
      });

      // Wait for server to be ready
      if (remote.waitPath) {
        await waitForServer(`${assetPrefix}${remote.waitPath}`);
      }

      servers.remotes.push({ app, port, name: remote.name, assetPrefix });
    }

    console.log(`Remote ${remote.name} started successfully on port ${port}`);
  }

  // Now start hosts with remote URLs configured
  for (const host of hosts) {
    const port = await getPort();
    const assetPrefix = `http://localhost:${port}`;

    // Build environment with remote URLs
    const remoteUrls = {};
    servers.remotes.forEach(remote => {
      remoteUrls[`${remote.name.toUpperCase()}_URL`] = remote.assetPrefix;
    });

    console.log(
      `Starting host ${host.name} on port ${port} with remotes:`,
      remoteUrls,
    );

    if (mode === 'dev') {
      const app = await launchApp(
        host.dir,
        port,
        {},
        {
          BUNDLER: bundler,
          ASSET_PREFIX: assetPrefix,
          ...remoteUrls,
        },
      );
      servers.hosts.push({ app, port, name: host.name, assetPrefix });
    } else {
      // Build first with remote URLs
      await modernBuild(host.dir, [], {
        env: {
          BUNDLER: bundler,
          ASSET_PREFIX: assetPrefix,
          ...remoteUrls,
        },
      });

      // Then serve
      const app = await modernServe(host.dir, port, {
        cwd: host.dir,
        env: {
          PORT: port,
          NODE_ENV: 'production',
          ASSET_PREFIX: assetPrefix,
          ...remoteUrls,
        },
      });

      // Wait for server to be ready
      if (host.waitPath) {
        await waitForServer(`${assetPrefix}${host.waitPath}`);
      }

      servers.hosts.push({ app, port, name: host.name, assetPrefix });
    }

    console.log(`Host ${host.name} started successfully on port ${port}`);
  }

  return servers;
}

/**
 * Stop all Module Federation servers
 */
async function stopModuleFederation(servers) {
  const { killApp } = require('./modernTestUtils');

  // Stop hosts first
  for (const host of servers.hosts || []) {
    await killApp(host.app);
  }

  // Then stop remotes
  for (const remote of servers.remotes || []) {
    await killApp(remote.app);
  }
}

module.exports = {
  startModuleFederation,
  stopModuleFederation,
  waitForServer,
};
