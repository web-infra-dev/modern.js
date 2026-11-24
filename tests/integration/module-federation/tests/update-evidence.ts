import { selectControl } from './select-control';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { HTTPRequest, HTTPResponse, Page } from 'puppeteer';

export const scenarios = ['ordinary', 'bridge', 'service'] as const;
export type Scenario = (typeof scenarios)[number];
export const scenarioRoutes = {
  ordinary: '/?lab=ssr&tab=cache',
  bridge: '/bridge-ssr/forecast/today',
  service: '/service/forecast/today',
} as const;

/** Use the same visible controls as a developer, preserving real Document responses. */
export async function exerciseUpdateRequestFrames(
  page: Page,
  origin: string,
  scenario: Scenario,
  onHeld?: () => Promise<void>,
) {
  const documents: {
    policy: string;
    status: number;
    html: string;
    render: string | undefined;
  }[] = [];
  const reads: Promise<void>[] = [];
  const receive = (response: HTTPResponse) => {
    const url = new URL(response.url());
    if (
      !url.searchParams.has('__labRequest') ||
      response.request().resourceType() !== 'document'
    )
      return;
    reads.push(
      response.text().then(html => {
        documents.push({
          policy: url.searchParams.get('__labPolicy')!,
          status: response.status(),
          html,
          render: response.headers()['x-modernjs-render'],
        });
      }),
    );
  };
  page.on('response', receive);
  await page.goto(origin + scenarioRoutes[scenario], {
    waitUntil: 'networkidle0',
  });
  await page.click('[data-testid="update-request-lab"] summary');
  try {
    await selectControl(page, '[data-testid="update-select"]', 'v2');
    await selectControl(page, '[data-testid="update-delay"]', '-1');
    await page.click('[data-testid="update-apply"]');
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="request-state"]')
          ?.getAttribute('data-held') === 'true',
    );
    await onHeld?.();
    await page.click('[data-testid="request-add"]');
    await page.click('[data-testid="request-add"]');
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(documents.filter(item => item.policy === 'wait')).toHaveLength(0);
    await selectControl(page, '[data-testid="request-policy"]', 'csr');
    await page.click('[data-testid="request-add"]');
    await selectControl(page, '[data-testid="request-policy"]', 'reject');
    await page.click('[data-testid="request-add"]');
    await expect
      .poll(() => documents.filter(item => item.policy !== 'wait').length)
      .toBe(2);
    const csr = documents.find(item => item.policy === 'csr')!;
    expect(csr.status).toBe(200);
    expect(csr.render).toBe('client');
    expect(csr.html).not.toContain('data-testid="weather-application"');
    expect(documents.find(item => item.policy === 'reject')!.status).toBe(503);
    expect(documents.filter(item => item.policy === 'wait')).toHaveLength(0);
    await page.click('[data-testid="request-release"]');
    await expect
      .poll(() => documents.filter(item => item.policy === 'wait').length, {
        timeout: 15000,
      })
      .toBe(2);
    for (const document of documents.filter(item => item.policy === 'wait')) {
      expect(document.status).toBe(200);
      assertServerVersion(document.html, scenario, 'v2:initial');
    }
    await page.waitForFunction(() => {
      const badge = document.querySelector('[data-testid="update-mode"]');
      return (
        badge?.getAttribute('data-state') === 'applied' &&
        ['Partial update', 'Application update'].includes(
          badge.textContent?.trim() || '',
        )
      );
    });
    return documents;
  } finally {
    await page.evaluate(() =>
      fetch('/_lab/update/lab/release', { method: 'POST' }),
    );
    await Promise.allSettled(reads);
    page.off('response', receive);
  }
}

export async function resetProducerVersion(page: Page, version = 'v1') {
  await page.evaluate(async target => {
    const check = await (
      await fetch(`/_lab/update/state?version=${encodeURIComponent(target)}`)
    ).json();
    if (check.pending) {
      await fetch('/_lab/update/lab/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: target, delayMs: 0 }),
      });
      for (let i = 0; i < 300; i++) {
        const status = await (await fetch('/_lab/update/lab/status')).json();
        if (status.operation?.completed) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await fetch(`/_lab/update/state?version=${encodeURIComponent(target)}`);
    }
  }, version);
}
export type MemorySample = {
  role: string;
  pid: number;
  heapUsed: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  gcExposed: boolean;
  serviceRequests?: number;
  diagnostics?: {
    moduleInfoKeys: string[];
    manifestLoadingKeys: string[];
    remoteEntryKeys: string[];
    resourceTimings: number;
    instances: {
      name?: string;
      id?: string;
      modules?: number;
      manifests?: number;
      retainedProviders?: number;
    }[];
    shareScopeKeys: string[];
  };
};
export type MemoryRound = { label: string; samples: MemorySample[] };
export type DocumentEvidence = {
  url: string;
  status: number;
  html?: string;
  error?: string;
  requestFailure?: string;
};

export async function artifactDirectory(mode: string, scenario: Scenario) {
  const parent = process.env.MF_LAB_ARTIFACT_DIR || tmpdir();
  await mkdir(parent, { recursive: true });
  return mkdtemp(path.join(parent, `remote-updates-${mode}-${scenario}-`));
}

export async function captureFailure(
  page: Page,
  directory: string,
  phase: unknown,
  error: unknown,
) {
  const snapshot: Record<string, unknown> = {
    phase,
    error: error instanceof Error ? error.stack : String(error),
    url: page.url(),
  };
  try {
    snapshot.shell = await page.$eval('body', body =>
      body.innerText.slice(0, 6000),
    );
    snapshot.frames = await Promise.all(
      page
        .frames()
        .filter(frame => frame !== page.mainFrame())
        .map(async frame => {
          const url = frame.url();
          try {
            return {
              url,
              text: await frame.$eval('body', body =>
                body.innerText.slice(0, 6000),
              ),
            };
          } catch (error) {
            return { url, error: String(error) };
          }
        }),
    );
  } catch (error) {
    snapshot.inspectionError = String(error);
  }
  try {
    await page.screenshot({
      path: path.join(directory, 'failure.png'),
      fullPage: true,
    });
    snapshot.screenshot = 'failure.png';
  } catch (error) {
    snapshot.screenshotError = String(error);
  }
  await writeFile(
    path.join(directory, 'failure.json'),
    JSON.stringify(snapshot, null, 2),
  );
}

export async function writeEvidence(
  directory: string,
  evidence: Record<string, unknown>,
  documents: DocumentEvidence[],
  announce = true,
) {
  await Promise.all(
    documents.map((document, index) =>
      writeFile(
        path.join(directory, `document-${index}.html`),
        document.html || document.error || 'Document response unavailable',
      ),
    ),
  );
  await writeFile(
    path.join(directory, 'result.json'),
    JSON.stringify(
      {
        ...evidence,
        documents: documents.map(({ html, ...document }, index) => ({
          ...document,
          file: `document-${index}.html`,
          bytes: html?.length,
        })),
      },
      null,
      2,
    ),
  );
  if (announce) console.info(`[MF update evidence] ${directory}`);
}

export function observeDocuments(page: Page, scenario: Scenario) {
  const documents: DocumentEvidence[] = [];
  const requests = new Map<HTTPRequest, DocumentEvidence>();
  const pending = new Set<Promise<void>>();
  const record = (request: HTTPRequest) => {
    const existing = requests.get(request);
    if (existing) return existing;
    if (
      !request.isNavigationRequest() ||
      (scenario === 'ordinary'
        ? request.frame()?.parentFrame() !== page.mainFrame() ||
          new URL(request.url()).pathname !== '/weather' ||
          new URL(request.url()).searchParams.has('csr')
        : request.frame() !== page.mainFrame())
    )
      return;
    const document: DocumentEvidence = {
      url: request.url(),
      status: request.response()?.status() ?? 0,
    };
    requests.set(request, document);
    documents.push(document);
    return document;
  };
  const failed = (request: HTTPRequest) => {
    const document = record(request);
    if (document) document.requestFailure = request.failure()?.errorText;
  };
  const listener = (response: HTTPResponse) => {
    const document = record(response.request());
    if (!document) return;
    document.status = response.status();
    const task = response
      .text()
      .then(html => {
        document.html = html;
      })
      .catch(error => {
        document.error = String(error);
      })
      .finally(() => pending.delete(task));
    pending.add(task);
  };
  page.on('response', listener);
  page.on('requestfailed', failed);
  return {
    documents,
    async settle() {
      await Promise.all(pending);
    },
    stop() {
      page.off('response', listener);
      page.off('requestfailed', failed);
    },
  };
}

export function assertServerVersion(
  html: string,
  scenario: Scenario,
  expected: string,
) {
  expect(html).not.toContain('Switched to client rendering');
  if (scenario === 'ordinary' && !html.includes('"static":"1"')) {
    for (const component of ['weather-hourly', 'weather-days', 'weather-wind'])
      expect(html).toContain(`data-testid="${component}"`);
  }
  let rendered = html;
  if (scenario !== 'ordinary') {
    const frames = [
      ...html.matchAll(
        /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
      ),
    ].map(
      match =>
        JSON.parse(match[1]) as [string, { type: string; html?: string }],
    );
    expect(frames.some(([, frame]) => frame.type === 'error')).toBe(false);
    expect(frames.some(([, frame]) => frame.type === 'done')).toBe(true);
    rendered = frames
      .filter(([, frame]) => frame.type === 'html')
      .map(([, frame]) => frame.html || '')
      .join('');
  }
  const versions = [
    ...rendered.matchAll(
      /data-testid="update-version"[^>]*>([\s\S]*?)<\/(?:span|small|output|p)>/g,
    ),
  ].map(match => match[1].replace(/<!--.*?-->|<[^>]*>/g, '').trim());
  expect(versions).toContain(expected);
  expect(versions.every(version => version === expected)).toBe(true);
}

export function assertReleaseEntry(html: string, entry: string) {
  const releases = [
    ...html.matchAll(/data-modern-mf-release>([\s\S]*?)<\/script>/g),
  ].map(
    match =>
      JSON.parse(match[1]) as {
        remotes: { name: string; entry: string }[];
      },
  );
  expect(
    releases.some(release =>
      release.remotes.some(remote => remote.entry === entry),
    ),
  ).toBe(true);
}

export async function waitForVersion(page: Page, expected: string) {
  await page.waitForFunction(
    version => {
      const frame = document.querySelector<HTMLIFrameElement>(
        '[data-testid="ssr-frame"]',
      );
      const rendered = frame ? frame.contentDocument : document;
      return (
        Boolean(document.querySelector('[data-testid="update-error"]')) ||
        rendered
          ?.querySelector('[data-testid="update-version"]')
          ?.textContent?.trim() === version
      );
    },
    { polling: 100, timeout: 60000 },
    expected,
  );
  const error = await page.$('[data-testid="update-error"]');
  if (error)
    throw new Error(
      await error.evaluate(
        element => element.textContent || 'Producer update failed',
      ),
    );
  const element = await page.$('[data-testid="ssr-frame"]');
  const frame = element ? await element.contentFrame() : page.mainFrame();
  if (!frame) throw new Error('The update iframe has no browsing context');
  expect(new URL(frame.url()).searchParams.has('csr')).toBe(false);
  return frame;
}

export async function assertInteraction(
  page: Page,
  scenario: Scenario,
  expected: string,
) {
  const frame = await waitForVersion(page, expected);
  const selector = `[data-testid="${scenario === 'ordinary' ? 'weather-save' : 'save-day'}"]`;
  await frame.waitForSelector(`${selector}:not(:disabled)`);
  if (scenario === 'ordinary') {
    await frame.waitForSelector(
      '[data-testid="weather-hourly"] button:not(:disabled)',
    );
    await frame.waitForSelector('[data-testid="weather-days"]');
    await frame.waitForSelector('[data-testid="weather-wind"]');
  } else {
    await frame.waitForSelector('[data-testid="outlook-resolved"]');
    // save-day has server HTML without a disabled attribute. The existing
    // hourly widget enables its controls in an effect after hydration commits.
    await frame.waitForSelector(
      '[data-testid="weather-hourly"] button:not(:disabled)',
    );
  }
  const pressed = await frame.$eval(selector, button =>
    button.getAttribute('aria-pressed'),
  );
  expect(['true', 'false']).toContain(pressed);
  await frame.click(selector);
  await frame.waitForFunction(
    (selector, nextPressed, version) =>
      document.querySelector(selector)?.getAttribute('aria-pressed') ===
        nextPressed &&
      document
        .querySelector('[data-testid="update-version"]')
        ?.textContent?.trim() === version,
    {},
    selector,
    pressed === 'true' ? 'false' : 'true',
    expected,
  );
  return frame.url();
}

export async function applyVersion(page: Page, version: string) {
  await page.waitForSelector('[data-testid="update-apply"]:not(:disabled)');
  await selectControl(page, '[data-testid="update-select"]', version);
  await page.click('[data-testid="update-apply"]');
  await waitForVersion(page, `${version}:initial`);
  expect(await page.$('[data-testid="update-error"]')).toBeNull();
}

export async function memorySample(url: string, gc = true) {
  const response = await fetch(`${url}/_lab/update/memory?gc=${gc ? 1 : 0}`, {
    signal: AbortSignal.timeout(30000),
  });
  expect(response.status).toBe(200);
  const { samples } = (await response.json()) as { samples: MemorySample[] };
  expect(samples.length).toBeGreaterThan(0);
  for (const sample of samples) {
    expect(sample.pid).toBeGreaterThan(0);
    if (gc) expect(sample.gcExposed).toBe(true);
    for (const name of ['heapUsed', 'rss', 'external', 'arrayBuffers'] as const)
      expect(Number.isFinite(sample[name])).toBe(true);
  }
  return samples;
}

export function assertSameProcesses(
  initial: MemorySample[],
  current: MemorySample[],
) {
  const identities = (samples: MemorySample[]) =>
    samples.map(({ role, pid }) => `${role}:${pid}`).sort();
  expect(identities(current)).toEqual(identities(initial));
}

const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export function compareMemory(
  baseline: MemoryRound[],
  rounds: MemoryRound[],
  final: MemoryRound[],
) {
  return baseline[0].samples.flatMap(initial =>
    (['heapUsed', 'rss', 'external', 'arrayBuffers'] as const).map(metric => {
      const values = (samples: MemoryRound[]) =>
        samples.map(round => {
          const sample = round.samples.find(
            sample => sample.role === initial.role,
          );
          if (!sample)
            throw new Error(`Missing memory sample: ${initial.role}`);
          return sample[metric];
        });
      const start = values(baseline);
      const end = values(final);
      const baselineBytes = median(start);
      const finalBytes = median(end);
      const deltaBytes = finalBytes - baselineBytes;
      return {
        role: initial.role,
        pid: initial.pid,
        metric,
        baselineBytes,
        finalBytes,
        deltaBytes,
        baselineRangeBytes: [Math.min(...start), Math.max(...start)],
        finalRangeBytes: [Math.min(...end), Math.max(...end)],
        perRoundBytes: values(rounds),
      };
    }),
  );
}
