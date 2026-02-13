const { spawn, exec } = require('child_process');
const http = require('http');
const httpProxy = require('http-proxy');
const util = require('util');
const fs = require('fs');
const path = require('path');

// Configuration
const PROXY_PORT = 3000;
let BFF_PREFIX = '/api'; // Default

// Helper to open URL in browser
function openBrowser(url) {
  const start =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  exec(`${start} ${url}`);
}

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// State
let bffPort = null;
let storybookPort = null;
let proxyServer = null;
const processes = [];

// Helper to strip ANSI codes
function stripAnsi(str) {
  if (util.stripVTControlCharacters) {
    return util.stripVTControlCharacters(str);
  }
  // Fallback
  return str.replace(/\x1B\[[\d;]*m/g, '');
}

// Attempt to parse config for bff.prefix
function getBffPrefix() {
  const configFiles = ['modern.config.ts', 'edenx.config.ts'];

  for (const configFile of configFiles) {
    try {
      const configPath = path.join(__dirname, configFile);
      if (fs.existsSync(configPath)) {
        console.log(`[Proxy Script] Checking config: ${configFile}`);
        const content = fs.readFileSync(configPath, 'utf8');
        // Simple regex to find prefix: '...' or prefix: "..."
        const match = content.match(/prefix:\s*['"]([^'"]+)['"]/);
        if (match?.[1]) {
          return match[1];
        }
      }
    } catch (e) {
      console.warn(
        `[Proxy Script] Failed to parse ${configFile} for BFF prefix`,
        e,
      );
    }
  }

  return '/api';
}

function startBFF() {
  console.log('\n[Proxy Script] 1. Starting BFF Server (API Only)...');
  const bff = spawn('npm', ['run', 'dev:api'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  processes.push(bff);

  bff.stdout.on('data', data => {
    const output = data.toString();
    process.stdout.write(output); // Pass through

    const cleanOutput = stripAnsi(output);
    // Match "Local: http://localhost:8080"
    const match = cleanOutput.match(/Local:\s+http:\/\/localhost:(\d+)/);
    if (match && !bffPort) {
      bffPort = parseInt(match[1], 10);
      console.log(`\n[Proxy Script] ✅ Detected BFF port: ${bffPort}`);

      // Start Storybook after BFF is ready
      startStorybook();
    }
  });

  bff.stderr.pipe(process.stderr);

  return bff;
}

function startStorybook() {
  console.log('\n[Proxy Script] 2. Starting Storybook...');
  const sb = spawn('npm', ['run', 'storybook'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  processes.push(sb);

  sb.stdout.on('data', data => {
    const output = data.toString();
    process.stdout.write(output);

    const cleanOutput = stripAnsi(output);
    // Storybook output usually contains "http://localhost:6006/"
    const match = cleanOutput.match(/http:\/\/localhost:(\d+)/);
    if (match && !storybookPort) {
      const port = parseInt(match[1], 10);
      if (port !== PROXY_PORT && port !== bffPort) {
        storybookPort = port;
        console.log(
          `\n[Proxy Script] ✅ Detected Storybook port: ${storybookPort}`,
        );

        // Start Proxy after both are ready
        startProxy();
      }
    }
  });

  sb.stderr.pipe(process.stderr);

  return sb;
}

function startProxy() {
  if (proxyServer) return;

  console.log('\n[Proxy Script] 3. Starting Proxy Server...');

  const server = http.createServer((req, res) => {
    if (!bffPort || !storybookPort) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Services starting... Please reload in a moment.');
      return;
    }

    if (req.url.startsWith(BFF_PREFIX)) {
      // Forward to BFF
      proxy.web(req, res, { target: `http://localhost:${bffPort}` }, err => {
        console.error('[Proxy Script] Proxy error to BFF:', err.message);
        if (!res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway (BFF)');
        }
      });
    } else {
      // Forward to Storybook
      proxy.web(
        req,
        res,
        { target: `http://localhost:${storybookPort}` },
        err => {
          console.error(
            '[Proxy Script] Proxy error to Storybook:',
            err.message,
          );
          if (!res.headersSent) {
            res.writeHead(502);
            res.end('Bad Gateway (Storybook)');
          }
        },
      );
    }
  });

  // Handle Websockets (HMR)
  server.on('upgrade', (req, socket, head) => {
    if (storybookPort) {
      proxy.ws(
        req,
        socket,
        head,
        { target: `http://localhost:${storybookPort}` },
        err => {
          console.error('[Proxy Script] Proxy error (WS):', err.message);
          socket.end();
        },
      );
    } else {
      socket.end();
    }
  });

  server.listen(PROXY_PORT, () => {
    const url = `http://localhost:${PROXY_PORT}`;
    console.log(`\n=========================================================`);
    console.log(`   🚀 Proxy Server Ready at ${url}`);
    console.log(`=========================================================`);
    console.log(`   - ${BFF_PREFIX}*  ->  BFF (port ${bffPort})`);
    console.log(`   - *       ->  Storybook (port ${storybookPort})`);
    console.log(`\nPress Ctrl+C to stop all services.`);

    // Auto open browser
    console.log('[Proxy Script] Opening browser...');
    openBrowser(url);

    proxyServer = server;
  });
}

// Start Sequence
console.log('[Proxy Script] Initializing...');
BFF_PREFIX = getBffPrefix();
console.log(`[Proxy Script] Using BFF prefix: ${BFF_PREFIX}`);
startBFF();

// Handle exit
function cleanup() {
  console.log('\n[Proxy Script] Stopping processes...');
  processes.forEach(p => p.kill());
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
