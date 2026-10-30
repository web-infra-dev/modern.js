import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineNode, z } from '@midscene/test';
import {
  defineFileSetup,
  defineProjectSetup,
  defineTestProject,
} from '@midscene/test/config';
import { createMidsceneNodes } from '@midscene/test/midscene';
import { PlaywrightAgent } from '@midscene/web/playwright/agent';
import { Fixtures, fixtureNames } from './fixtures.js';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from 'playwright';

config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

interface Context {
  browser: Browser;
  fixtures: Fixtures;
  session?: BrowserContext;
  page?: Page;
  agent?: PlaywrightAgent;
}
interface ProjectContext {
  browser: Browser;
  fixtures: Fixtures;
}
const concurrency = Number(process.env.MIDSCENE_FILE_CONCURRENCY ?? '1');
if (![1, 5, 15].includes(concurrency))
  throw new Error('File concurrency must be 1, 5, or 15');
const setup = defineProjectSetup<ProjectContext>({
  name: 'web',
  async setup({ onTeardown, signal }) {
    const fixtures = new Fixtures(signal);
    onTeardown(() => fixtures.close());
    const browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
    });
    onTeardown(() => browser.close());
    return { browser, fixtures };
  },
});
const fileSetup = defineFileSetup<Context, ProjectContext>({
  name: 'isolated-page',
  async setup({ projectContext, onTeardown }) {
    if (!projectContext) throw new Error('Browser setup did not complete');
    const context: Context = { ...projectContext };
    onTeardown(async () => {
      try {
        await context.agent?.destroy();
      } finally {
        await context.session?.close();
      }
    });
    return context;
  },
});
const input = z.strictObject({
  fixture: z.enum(fixtureNames),
  mode: z.enum(['dev', 'build']).default('dev'),
  path: z.string().startsWith('/').default('/'),
  viewport: z.enum(['desktop', 'mobile']).default('desktop'),
});
const open = defineNode<typeof input, void, Context>({
  name: 'app.open',
  description: 'Open a local fixture in a fresh browser session.',
  inputSchema: input,
  async execute({ context, input }) {
    const baseURL = await context.fixtures.open(input.fixture, input.mode);
    const url = new URL(input.path, baseURL);
    if (url.origin !== new URL(baseURL).origin)
      throw new Error('Only fixture routes are allowed');
    await context.agent?.destroy();
    context.agent = undefined;
    await context.session?.close();
    context.session = await context.browser.newContext({
      locale: 'en-US',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      viewport:
        input.viewport === 'mobile'
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
    });
    await context.session.addCookies([
      { name: 'i18next', value: 'en', url: baseURL },
    ]);
    await context.session.route('**/*', route => {
      const requestURL = new URL(route.request().url());
      return ['data:', 'blob:'].includes(requestURL.protocol) ||
        requestURL.origin === url.origin
        ? route.continue()
        : route.abort('blockedbyclient');
    });
    context.page = await context.session.newPage();
    await context.page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await context.page.locator('body').first().waitFor({ state: 'visible' });
  },
});
export default defineTestProject<Context, ProjectContext>({
  test: {
    maxConcurrentProjects: 1,
    maxConcurrentFiles: concurrency,
    // Includes bounded model-request cooldowns; assertions and case retries are unchanged.
    testTimeout: 15 * 60_000,
  },
  projects: [
    {
      name: 'web',
      setup,
      fileSetup,
      maxConcurrentFiles: concurrency,
      retry: 0,
      files: {
        include: ['cases/**/*.yaml'],
      },
      tags: {
        include: (process.env.MIDSCENE_INCLUDE_TAGS ?? '')
          .split(',')
          .filter(Boolean),
      },
    },
  ],
  nodes: [
    open,
    ...createMidsceneNodes<Context>({
      agentClass: PlaywrightAgent,
      getAgent({ context }) {
        if (!context.page) throw new Error('Call app.open first');
        return (context.agent ??= new PlaywrightAgent(context.page));
      },
    }),
  ],
});
