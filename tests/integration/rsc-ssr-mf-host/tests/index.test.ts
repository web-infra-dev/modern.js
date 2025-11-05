import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const hostAppDir = path.resolve(__dirname, '../');
const remoteAppDir = path.resolve(__dirname, '../../rsc-ssr-mf');

interface TestConfig {
  bundler: 'webpack'; // Only webpack for now
  mode: 'dev' | 'build';
}

// Helper to wait for a URL to be ready
async function waitForServer(url: string, timeout = 30000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        // 404 is ok - server is running
        return;
      }
    } catch (error) {
      // Server not ready yet, will retry
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

interface TestOptions {
  baseUrl: string;
  hostPort: number;
  remotePort: number;
  page: Page;
}

function skipForLowerNodeVersion() {
  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });
    return true;
  }
  return false;
}

function runTests({ bundler, mode }: TestConfig) {
  describe(`${mode} with ${bundler}`, () => {
    let hostApp: any;
    let remoteApp: any;
    let page: Page | undefined;
    let browser: Browser | undefined;
    const errors: string[] = [];
    let hostPort: number;
    let remotePort: number;

    if (skipForLowerNodeVersion()) {
      return;
    }

    const shutdown = async () => {
      try {
        if (page) {
          await page.close();
        }
      } catch (err) {
        console.error('Failed to close page', err);
      } finally {
        page = undefined;
      }

      try {
        if (browser) {
          await browser.close();
        }
      } catch (err) {
        console.error('Failed to close browser', err);
      } finally {
        browser = undefined;
      }

      const shutdowns: Promise<unknown>[] = [];
      if (hostApp) {
        shutdowns.push(
          killApp(hostApp).catch(err =>
            console.error('Failed to kill host app', err),
          ),
        );
        hostApp = null;
      }
      if (remoteApp) {
        shutdowns.push(
          killApp(remoteApp).catch(err =>
            console.error('Failed to kill remote app', err),
          ),
        );
        remoteApp = null;
      }
      if (shutdowns.length) {
        await Promise.all(shutdowns);
      }
    };

    beforeAll(async () => {
      // Increase timeout for multiple apps
      jest.setTimeout(120 * 1000);

      [remotePort, hostPort] = await Promise.all([getPort(), getPort()]);

      try {
        if (mode === 'dev') {
          // Clean .modern-js directories to ensure fresh builds with correct ports
          const fs = require('fs');
          const remoteDotModernJs = path.join(
            remoteAppDir,
            'node_modules',
            '.modern-js',
          );
          const hostDotModernJs = path.join(
            hostAppDir,
            'node_modules',
            '.modern-js',
          );
          if (fs.existsSync(remoteDotModernJs)) {
            fs.rmSync(remoteDotModernJs, { recursive: true, force: true });
          }
          if (fs.existsSync(hostDotModernJs)) {
            fs.rmSync(hostDotModernJs, { recursive: true, force: true });
          }

          // Launch remote first so manifest is ready before host boot
          remoteApp = await launchApp(
            remoteAppDir,
            remotePort,
            {},
            {
              BUNDLER: bundler,
              REMOTE_IP_STRATEGY: 'inherit',
              ASSET_PREFIX: `http://localhost:${remotePort}`,
              MODERN_MF_AUTO_CORS: '1',
            },
          );

          console.log(
            `Waiting for SSR remote at http://localhost:${remotePort}/static/mf-manifest.json`,
          );
          const manifestUrl = `http://localhost:${remotePort}/static/mf-manifest.json`;
          await waitForServer(manifestUrl);

          // Double-check manifest is accessible
          try {
            const response = await fetch(manifestUrl);
            if (!response.ok) {
              throw new Error(`Manifest not accessible: ${response.status}`);
            }
            const manifest = await response.json();
            console.log(`Remote manifest loaded: ${manifest.name}`);
          } catch (error) {
            console.error(
              `Failed to verify manifest at ${manifestUrl}:`,
              error,
            );
            throw error;
          }

          console.log('SSR Remote server is ready');

          hostApp = await launchApp(
            hostAppDir,
            hostPort,
            {},
            {
              BUNDLER: bundler,
              REMOTE_URL: `http://localhost:${remotePort}`,
              REMOTE_IP_STRATEGY: 'inherit',
              ASSET_PREFIX: `http://localhost:${hostPort}`,
              // SSR host requires react-server condition to load RSC server code
              NODE_OPTIONS: [
                process.env.NODE_OPTIONS,
                '--conditions=react-server',
              ]
                .filter(Boolean)
                .join(' '),
            },
          );

          // Dev server is listening (launchApp resolved on "> Local:"), give it a brief tick
          console.log(
            `SSR Host dev server reported listening; pausing briefly`,
          );
          await new Promise(r => setTimeout(r, 2000));
          console.log('SSR Host server is ready');
        } else {
          // Build both apps first in parallel
          await Promise.all([
            modernBuild(remoteAppDir, [], {
              env: {
                BUNDLER: bundler,
                REMOTE_IP_STRATEGY: 'inherit',
                ASSET_PREFIX: `http://localhost:${remotePort}`,
                MODERN_MF_AUTO_CORS: '1',
              },
            }),
            modernBuild(hostAppDir, [], {
              env: {
                BUNDLER: bundler,
                REMOTE_URL: `http://localhost:${remotePort}`,
                REMOTE_IP_STRATEGY: 'inherit',
                ASSET_PREFIX: `http://localhost:${hostPort}`,
              },
            }),
          ]);

          // Start remote server first
          remoteApp = await modernServe(remoteAppDir, remotePort, {
            cwd: remoteAppDir,
            env: {
              PORT: remotePort,
              NODE_ENV: 'production',
              REMOTE_IP_STRATEGY: 'inherit',
              ASSET_PREFIX: `http://localhost:${remotePort}`,
              MODERN_MF_AUTO_CORS: '1',
            },
          });

          // Wait for remote to be ready
          console.log(
            `Waiting for SSR remote at http://localhost:${remotePort}/static/mf-manifest.json`,
          );
          const manifestUrl = `http://localhost:${remotePort}/static/mf-manifest.json`;
          await waitForServer(manifestUrl);

          // Double-check manifest is accessible
          try {
            const response = await fetch(manifestUrl);
            if (!response.ok) {
              throw new Error(`Manifest not accessible: ${response.status}`);
            }
            const manifest = await response.json();
            console.log(`Remote manifest loaded: ${manifest.name}`);
          } catch (error) {
            console.error(
              `Failed to verify manifest at ${manifestUrl}:`,
              error,
            );
            throw error;
          }

          console.log('SSR Remote server is ready');

          // Now start host server
          hostApp = await modernServe(hostAppDir, hostPort, {
            cwd: hostAppDir,
            env: {
              PORT: hostPort,
              NODE_ENV: 'production',
              REMOTE_URL: `http://localhost:${remotePort}`,
              REMOTE_IP_STRATEGY: 'inherit',
              ASSET_PREFIX: `http://localhost:${hostPort}`,
              // SSR host requires react-server condition to load RSC server code
              NODE_OPTIONS: [
                process.env.NODE_OPTIONS,
                '--conditions=react-server',
              ]
                .filter(Boolean)
                .join(' '),
            },
          });

          // Wait for host to be ready too
          console.log(`Waiting for SSR host at http://localhost:${hostPort}/`);
          await waitForServer(`http://localhost:${hostPort}/`);
          console.log('SSR Host server is ready');
        }

        browser = await puppeteer.launch(launchOptions as any);
        page = await browser.newPage();

        if (page) {
          // Capture page errors for debugging
          page.on('pageerror', error => {
            errors.push(error.message);
            console.error('Page error:', error.message);
          });

          // Capture console errors
          page.on('console', msg => {
            if (msg.type() === 'error') {
              console.error('Browser console error:', msg.text());
            }
          });

          // Capture network failures
          page.on('requestfailed', request => {
            console.error(`Failed request: ${request.url()}`);
          });
        }
      } catch (error) {
        await shutdown();
        throw error;
      }
    });

    afterAll(async () => {
      await shutdown();

      // Check for errors at the end
      if (errors.length > 0) {
        console.warn('Page errors during tests:', errors);
      }
    });

    describe('Module Federation SSR Integration', () => {
      const baseUrl = `/`;

      it('should load SSR remote components in host', async () => {
        await testRemoteComponentLoads({
          baseUrl,
          hostPort,
          remotePort,
          page: page!,
        });
      });

      it('should execute server actions from SSR remote components', async () => {
        await testRemoteServerActions({
          baseUrl,
          hostPort,
          remotePort,
          page: page!,
        });
      });

      it('should handle SSR remote component state correctly', async () => {
        await testRemoteComponentState({
          baseUrl,
          hostPort,
          remotePort,
          page: page!,
        });
      });
    });

    describe('SSR Remote app independence', () => {
      it('should work when SSR remote is accessed directly', async () => {
        await testRemoteDirectAccess({
          baseUrl: '/server-component-root',
          hostPort,
          remotePort,
          page: page!,
        });
      });
    });
  });
}

async function testRemoteComponentLoads({
  baseUrl,
  hostPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${hostPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 50000,
  });

  // Check that host page loaded
  const hostHeader = await page.$eval('body', el =>
    el.textContent?.includes('SSR Host Application'),
  );
  expect(hostHeader).toBe(true);

  // Check that remote Counter component content is present
  const counterPresent = await page.$eval('body', el =>
    el.textContent?.includes('Client State'),
  );
  expect(counterPresent).toBe(true);

  // Verify specific remote sections loaded
  const remoteSections = await page.$$eval(
    '.remote-section',
    sections => sections.length,
  );
  expect(remoteSections).toBeGreaterThan(0);
}

async function testRemoteServerActions({
  baseUrl,
  hostPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${hostPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 50000,
  });

  // Wait for remote component to fully load
  await page.waitForSelector('.client-count', { timeout: 10000 });

  // Test client state (from remote component)
  let clientCount = await page.$eval('.client-count', el => el.textContent);
  expect(clientCount).toBe('0');

  await page.click('.client-increment');
  clientCount = await page.$eval('.client-count', el => el.textContent);
  expect(clientCount).toBe('1');

  // Test server action (from remote component, executed on HOST server)
  await page.waitForSelector('.server-increment', { timeout: 10000 });
  await page.click('.server-increment');

  await page.waitForFunction(
    () =>
      !document.querySelector('.server-increment')?.hasAttribute('disabled'),
    { timeout: 10000 },
  );

  const serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(serverCount).toBe('1');
}

async function testRemoteComponentState({
  baseUrl,
  hostPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${hostPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 50000,
  });

  // Wait for page to be fully loaded
  await page.waitForSelector('body', { timeout: 10000 });

  // Verify server state from remote component
  const serverState = await page.$eval('body', el =>
    el.textContent?.includes('Server State'),
  );
  expect(serverState).toBe(true);

  // Verify Dynamic Message loaded
  const dynamicMessage = await page.$eval('body', el =>
    el.textContent?.includes('Dynamic Message'),
  );
  expect(dynamicMessage).toBe(true);
}

async function testRemoteDirectAccess({
  baseUrl,
  remotePort,
  page,
}: TestOptions) {
  // Verify remote app works independently
  await page.goto(`http://localhost:${remotePort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 50000,
  });

  const pageContent = await page.$eval('body', el => el.textContent);
  expect(pageContent).toContain('Client State');
  expect(pageContent).toContain('Server State');
  expect(pageContent).toContain('countStateFromServer');
}

// Run tests only for webpack (as per requirements)
runTests({ bundler: 'webpack', mode: 'dev' });
runTests({ bundler: 'webpack', mode: 'build' });
