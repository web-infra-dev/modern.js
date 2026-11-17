import { verifyNestedWindUpdate } from './wind-update';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeLab } from './fixture';
import {
  applyVersion,
  artifactDirectory,
  assertInteraction,
  assertReleaseEntry,
  assertSameProcesses,
  assertServerVersion,
  captureFailure,
  compareMemory,
  memorySample,
  observeDocuments,
  scenarios,
  scenarioRoutes,
  waitForVersion,
  writeEvidence,
  type MemoryRound,
  type DocumentEvidence,
  exerciseUpdateRequestFrames,
} from './update-evidence';

const updateCount = Number(process.env.MF_LAB_UPDATE_COUNT || 10);
if (!Number.isSafeInteger(updateCount) || updateCount < 1 || updateCount > 1000)
  throw new Error('MF_LAB_UPDATE_COUNT must be an integer from 1 to 1000');
const selectedScenarios = process.env.MF_LAB_UPDATE_SCENARIOS?.split(',');
for (const scenario of scenarios.filter(
  item => !selectedScenarios || selectedScenarios.includes(item),
)) {
  describeLab(
    `Producer updates / ${scenario}`,
    getContext => {
      if (getContext().mode === 'production') {
        if (scenario === 'service')
          it('mounts a Service only after click and records visible and interactive timings', async () => {
            const { page, lab } = getContext();
            const posts: string[] = [];
            page.on('request', request => {
              if (
                request.method() === 'POST' &&
                request.url().includes('/mf/service/')
              )
                posts.push(request.url());
            });
            await page.goto(`${lab.url}/service/forecast/today?late=1`, {
              waitUntil: 'networkidle0',
            });
            expect(
              await page.$('[data-testid="weather-application"]'),
            ).toBeNull();
            expect(posts).toHaveLength(0);
            await page.waitForSelector(
              '[data-testid="service-connect"]:not(:disabled)',
            );
            await page.click('[data-testid="service-connect"]');
            await page.waitForSelector(
              '[data-testid="service-mount-timing"][data-visible-ms][data-ready-ms]',
            );
            const timing = await page.$eval(
              '[data-testid="service-mount-timing"]',
              element => ({
                visible: Number(element.getAttribute('data-visible-ms')),
                ready: Number(element.getAttribute('data-ready-ms')),
              }),
            );
            expect(timing.visible).toBeGreaterThanOrEqual(0);
            expect(timing.ready).toBeGreaterThanOrEqual(0);
            expect(posts).toHaveLength(1);
            await page.click('[data-testid="save-day"]');
            await page.waitForFunction(
              () =>
                document.querySelector('[data-testid="favorite-count"]')
                  ?.textContent === '1',
            );
            console.info('Service click-to-mount timings (ms)', timing);
          });
        it('keeps two iframe requests pending while CSR and reject requests return according to policy', async () => {
          const { page, lab } = getContext();
          await exerciseUpdateRequestFrames(page, lab.url, scenario);
        });
      }
      if (getContext().mode === 'dev') {
        if (scenario === 'service') {
          it('keeps a mixed-export layout reload on SSR while the Service producer updates', async () => {
            const { page, lab, workspace } = getContext();
            const source = path.join(
              workspace,
              'provider/src/routes/weather-application/layout.tsx',
            );
            const original = await readFile(source, 'utf8');
            const marker = 'Service layout reload regression';
            const changed = original.replace(
              /<p>MY WEATHER \/[^<]*<\/p>/,
              `<p>${marker}</p>`,
            );
            expect(changed).not.toBe(original);
            const observer = observeDocuments(page, 'service');
            try {
              await page.goto(`${lab.url}${scenarioRoutes.service}`, {
                waitUntil: 'networkidle0',
              });
              await assertInteraction(page, 'service', 'v1:initial');
              await observer.settle();
              const before = observer.documents.length;
              await writeFile(source, changed);
              // shouldRevalidate is a valid route export but is currently not a
              // Refresh boundary. Its native reload must still receive fresh SSR.
              await page.waitForFunction(
                text =>
                  document.querySelector('.weather-app-header p')
                    ?.textContent === text,
                { timeout: 60000 },
                marker,
              );
              await observer.settle();
              expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
              const documents = observer.documents
                .slice(before)
                .filter(
                  document =>
                    document.status === 200 && !document.requestFailure,
                );
              expect(documents.length).toBeGreaterThan(0);
              for (const document of documents) {
                assertServerVersion(document.html!, 'service', 'v1:initial');
                expect(document.html).toContain(marker);
              }
              const response = await fetch(page.url());
              expect(response.status).toBe(200);
              const html = await response.text();
              assertServerVersion(html, 'service', 'v1:initial');
              expect(html).toContain(marker);
              await assertInteraction(page, 'service', 'v1:initial');
            } finally {
              if ((await readFile(source, 'utf8')) === changed)
                await writeFile(source, original);
              observer.stop();
            }
          }, 120000);
        }
        if (scenario === 'bridge') {
          it('waits for Node readiness on a manual refresh while an older SSR stream drains', async () => {
            const { lab, workspace } = getContext();
            const source = path.join(
              workspace,
              'provider/src/update-version.tsx',
            );
            const original = await readFile(source, 'utf8');
            const changed = original.replace(
              "developmentRevision = 'initial'",
              "developmentRevision = 'admission-ready'",
            );
            const probe = `ssr-update-admission-${Date.now()}`;
            const controller = new AbortController();
            const oldDocument = fetch(
              `${lab.url}${scenarioRoutes.bridge}?probe=${probe}&hold=1`,
              { signal: controller.signal },
            ).then(response => response.text());
            // Handle a cancelled fixture request even if an earlier assertion fails.
            void oldDocument.catch(() => {});
            try {
              await expect
                .poll(
                  () =>
                    lab.bridgeRequests.some(request => request.probe === probe),
                  { timeout: 15000 },
                )
                .toBe(true);
              const updating = () =>
                (lab.logs.get('host-v1') || '').match(/\[MF SSR\] Updating/g)
                  ?.length || 0;
              const before = updating();
              await writeFile(source, changed);
              await expect
                .poll(updating, { timeout: 30000 })
                .toBeGreaterThan(before);
              let admitted = false;
              const refreshed = fetch(`${lab.url}${scenarioRoutes.bridge}`, {
                signal: controller.signal,
              }).then(async response => {
                admitted = true;
                expect(response.status).toBe(200);
                return response.text();
              });
              void refreshed.catch(() => {});
              // The response cannot begin while the current generation is held.
              await new Promise(resolve => setTimeout(resolve, 200));
              expect(admitted).toBe(false);
              lab.releaseBridge(probe);
              const [oldHTML, nextHTML] = await Promise.all([
                oldDocument,
                refreshed,
              ]);
              assertServerVersion(oldHTML, 'bridge', 'v1:initial');
              assertServerVersion(nextHTML, 'bridge', 'v1:admission-ready');
            } finally {
              lab.releaseBridge(probe);
              controller.abort();
              if ((await readFile(source, 'utf8')) === changed)
                await writeFile(source, original);
              await expect
                .poll(
                  async () => {
                    const response = await fetch(
                      `${lab.url}${scenarioRoutes.bridge}`,
                    );
                    try {
                      assertServerVersion(
                        await response.text(),
                        'bridge',
                        'v1:initial',
                      );
                      return response.ok;
                    } catch {
                      return false;
                    }
                  },
                  { timeout: 30000 },
                )
                .toBe(true);
            }
          }, 90000);
        }
        it('observes producer edits through the shell and refreshes Node SSR without restarting', async () => {
          const { page, lab, workspace } = getContext();
          const directory = await artifactDirectory('dev', scenario);
          const source = path.join(
            workspace,
            'provider/src/update-version.tsx',
          );
          const original = await readFile(source, 'utf8');
          const changed = original.replace(
            "developmentRevision = 'initial'",
            "developmentRevision = 'updated'",
          );
          expect(changed).not.toBe(original);
          const observer = observeDocuments(page, scenario);
          const evidence: Record<string, unknown> = {
            mode: 'dev',
            scenario,
            completed: false,
          };
          try {
            evidence.phase = 'open-shell';
            await page.goto(`${lab.url}${scenarioRoutes[scenario]}`, {
              waitUntil: 'networkidle0',
            });
            evidence.phase = 'initial-render-and-interaction';
            await assertInteraction(page, scenario, 'v1:initial');
            await observer.settle();
            const initial = observer.documents.at(-1)!;
            expect(initial.status).toBe(200);
            assertServerVersion(initial.html!, scenario, 'v1:initial');
            const before = await memorySample(lab.url, false);
            evidence.processesBefore = before;
            const shellUrl = page.url();
            const originalFrameSource =
              scenario === 'ordinary'
                ? await page.$eval('[data-testid="ssr-frame"]', element =>
                    element.getAttribute('src'),
                  )
                : undefined;
            const documentCount = observer.documents.length;

            // No test navigation, page.reload or iframe src assignment follows
            // this edit. Browser HMR alone owns the rendered update.
            evidence.phase = 'edit-producer-and-wait-for-automatic-refresh';
            await writeFile(source, changed);
            const updatedFrame = await waitForVersion(page, 'v1:updated');
            evidence.phase = 'updated-interaction';
            await assertInteraction(page, scenario, 'v1:updated');
            expect(page.url()).toBe(shellUrl);
            if (scenario === 'ordinary')
              expect(
                await page.$eval('[data-testid="ssr-frame"]', element =>
                  element.getAttribute('src'),
                ),
              ).toBe(originalFrameSource);
            expect(new URL(updatedFrame.url()).searchParams.has('csr')).toBe(
              false,
            );
            evidence.phase = 'no-node-triggered-browser-navigation';
            await observer.settle();
            expect(observer.documents.slice(documentCount)).toHaveLength(0);

            // HMR may keep the browser document. A separate raw request proves
            // the next Node SSR render also stopped serving the old module.
            evidence.phase = 'updated-node-ssr';
            const serverDocument: DocumentEvidence = {
              url: updatedFrame.url(),
              status: 0,
            };
            observer.documents.push(serverDocument);
            await expect
              .poll(
                async () => {
                  const response = await fetch(updatedFrame.url(), {
                    signal: AbortSignal.timeout(15000),
                  });
                  serverDocument.status = response.status;
                  serverDocument.html = await response.text();
                  try {
                    expect(response.status).toBe(200);
                    assertServerVersion(
                      serverDocument.html,
                      scenario,
                      'v1:updated',
                    );
                    return true;
                  } catch {
                    return false;
                  }
                },
                { timeout: 60000 },
              )
              .toBe(true);
            // A user refresh receives the prepared Node generation. Node's
            // completion must not reload or revalidate the mounted browser first.
            await observer.settle();
            expect(
              observer.documents
                .slice(documentCount)
                .filter(document => document !== serverDocument),
            ).toHaveLength(0);
            await page.reload({ waitUntil: 'networkidle0' });
            await waitForVersion(page, 'v1:updated');
            await assertInteraction(page, scenario, 'v1:updated');
            evidence.phase = 'verify-process-and-service-transport';
            const after = await memorySample(lab.url, false);
            assertSameProcesses(before, after);
            if (scenario === 'service') {
              expect(
                after.find(sample => sample.role === 'provider-v1')!
                  .serviceRequests,
              ).toBeGreaterThan(
                before.find(sample => sample.role === 'provider-v1')!
                  .serviceRequests!,
              );
              expect([...lab.logs.values()].join('\n')).not.toContain(
                'SERVICE_NODE_ENTRY_ATTEMPT',
              );
            }
            evidence.processesAfter = after;
            if (scenario === 'ordinary') {
              evidence.phase = 'nested-rslib-source-update-and-restore';
              await verifyNestedWindUpdate(page, workspace, observer.documents);
            }
            evidence.completed = true;
            evidence.phase = 'complete';
          } catch (error) {
            evidence.error = String(error);
            await captureFailure(page, directory, evidence.phase, error).catch(
              captureError => {
                evidence.captureError = String(captureError);
              },
            );
            throw error;
          } finally {
            // The temporary source belongs to this test. Preserve evidence
            // outside that workspace before the fixture removes it.
            await writeFile(source, original);
            await observer.settle();
            observer.stop();
            await writeEvidence(directory, evidence, observer.documents);
          }
        }, 180000);
      } else {
        it(
          'switches two built producers ten times and records post-GC memory',
          async () => {
            const { page, lab } = getContext();
            const directory = await artifactDirectory('production', scenario);
            const observer = observeDocuments(page, scenario);
            const baseline: MemoryRound[] = [];
            const rounds: MemoryRound[] = [];
            const final: MemoryRound[] = [];
            const evidence: Record<string, unknown> = {
              mode: 'production',
              scenario,
              completedUpdates: 0,
              baseline,
              rounds,
              final,
              interpretation:
                'Memory is measured after warming both versions and running the configured number of successful SSR updates. Baseline and final medians, ranges and per-round samples are reported without an assumed leak threshold. RSS may retain allocated pages after GC.',
            };
            try {
              const snapshot = async (label: string) => {
                if (
                  !process.env.MF_LAB_HEAP_DIR ||
                  (process.env.MF_LAB_HEAP_FINAL_ONLY === '1' &&
                    label !== 'idle')
                )
                  return;
                const response = await fetch(
                  `${lab.url}/_lab/update/heap?label=${label}`,
                  { method: 'POST' },
                );
                expect(response.status).toBe(200);
                console.info('[MF heap snapshot]', await response.json());
              };
              evidence.updateCount = updateCount;
              evidence.renderOnlyControl =
                process.env.MF_LAB_MEMORY_CONTROL === '1';
              evidence.phase = 'producer-build-versions';
              const buildVersions = await Promise.all(
                [lab.ports.provider, lab.ports.providerV2].map(async port => {
                  const response = await fetch(
                    `http://localhost:${port}/static/mf-manifest.json`,
                    { signal: AbortSignal.timeout(15000) },
                  );
                  expect(response.status).toBe(200);
                  const manifest = await response.json();
                  return manifest.metaData?.buildInfo?.buildVersion;
                }),
              );
              evidence.buildVersions = buildVersions;
              for (const version of buildVersions) {
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
              }
              expect(buildVersions[0]).not.toBe(buildVersions[1]);
              evidence.phase = 'open-shell';
              await page.goto(`${lab.url}${scenarioRoutes[scenario]}`, {
                waitUntil: 'networkidle0',
              });
              evidence.phase = 'initial-render-and-interaction';
              await assertInteraction(page, scenario, 'v1:initial');
              evidence.phase = 'initial-process-sample';
              const identities = await memorySample(lab.url);
              expect(identities.some(sample => sample.role === 'host')).toBe(
                true,
              );
              if (scenario === 'service') {
                expect(identities.map(sample => sample.role).sort()).toEqual([
                  'host',
                  'provider-v1',
                  'provider-v2',
                ]);
                expect(new Set(identities.map(sample => sample.pid)).size).toBe(
                  3,
                );
              }

              // Warm both versions and return to v1 before measuring retention.
              for (const version of ['v2', 'v1']) {
                evidence.phase = `warm-${version}-apply`;
                await applyVersion(page, version);
                evidence.phase = `warm-${version}-render-and-interaction`;
                await assertInteraction(page, scenario, `${version}:initial`);
              }
              await observer.settle();
              for (let index = 0; index < 3; index++) {
                evidence.phase = `baseline-${index + 1}-gc`;
                const samples = await memorySample(lab.url);
                assertSameProcesses(identities, samples);
                baseline.push({ label: `baseline-${index + 1}`, samples });
              }
              await snapshot('baseline');

              for (let index = 0; index < updateCount; index++) {
                const version =
                  process.env.MF_LAB_MEMORY_CONTROL === '1'
                    ? 'v1'
                    : index % 2 === 0
                      ? 'v2'
                      : 'v1';
                const documentCount = observer.documents.length;
                evidence.phase = `update-${index + 1}-${version}-apply`;
                await applyVersion(page, version);
                evidence.phase = `update-${index + 1}-${version}-render-and-interaction`;
                const url = await assertInteraction(
                  page,
                  scenario,
                  `${version}:initial`,
                );
                evidence.phase = `update-${index + 1}-${version}-ssr-evidence`;
                await observer.settle();
                const documents = observer.documents.slice(documentCount);
                expect(documents).toHaveLength(1);
                expect(documents[0].status).toBe(200);
                expect(documents[0].url).toBe(url);
                assertServerVersion(
                  documents[0].html!,
                  scenario,
                  `${version}:initial`,
                );
                assertReleaseEntry(
                  documents[0].html!,
                  `http://localhost:${lab.ports[version === 'v1' ? 'provider' : 'providerV2']}/static/mf-manifest.json`,
                );
                evidence.phase = `update-${index + 1}-${version}-gc`;
                const samples = await memorySample(lab.url);
                assertSameProcesses(identities, samples);
                if (scenario === 'service') {
                  const previous = (rounds.at(-1) || baseline.at(-1))!.samples;
                  const selectedRole = `provider-${version}`;
                  expect(
                    samples.find(sample => sample.role === selectedRole)!
                      .serviceRequests,
                  ).toBeGreaterThan(
                    previous.find(sample => sample.role === selectedRole)!
                      .serviceRequests!,
                  );
                  expect([...lab.logs.values()].join('\n')).not.toContain(
                    'SERVICE_NODE_ENTRY_ATTEMPT',
                  );
                }
                rounds.push({
                  label: `update-${index + 1}-${version}`,
                  samples,
                });
                evidence.completedUpdates = index + 1;
                if ([10, 50, updateCount].includes(index + 1))
                  await snapshot(`round-${index + 1}`);
                if ((index + 1) % 10 === 0)
                  console.info(
                    `[MF memory progress] ${scenario} ${index + 1}/${updateCount}`,
                    samples.map(({ role, heapUsed }) => ({ role, heapUsed })),
                  );
                // Keep completed rounds if a later update or process crashes.
                await writeEvidence(
                  directory,
                  evidence,
                  observer.documents,
                  false,
                );
              }
              expect(evidence.completedUpdates).toBe(updateCount);
              for (let index = 0; index < 3; index++) {
                evidence.phase = `final-${index + 1}-gc`;
                const samples = await memorySample(lab.url);
                assertSameProcesses(identities, samples);
                final.push({ label: `final-${index + 1}`, samples });
              }
              const comparison = compareMemory(baseline, rounds, final);
              evidence.comparison = comparison;
              // The same samples are accessible to a person reviewing the shell.
              evidence.phase = 'idle-gc';
              if (process.env.MF_LAB_MEMORY_DIAGNOSTICS === '1') {
                await new Promise(resolve => setTimeout(resolve, 6000));
                evidence.idleSamples = await memorySample(lab.url);
                const response = await fetch(
                  `${lab.url}/_lab/update/clear-timings`,
                  { method: 'POST' },
                );
                evidence.timingClear = await response.json();
                evidence.afterTimingClear = await memorySample(lab.url);
                await snapshot('idle');
              }
              evidence.phase = 'shell-memory-table';
              await page.click('[data-testid="update-memory"]');
              await page.waitForSelector('[data-testid="update-memory-table"]');
              evidence.phase = 'complete';
            } catch (error) {
              evidence.error = String(error);
              await captureFailure(
                page,
                directory,
                evidence.phase,
                error,
              ).catch(captureError => {
                evidence.captureError = String(captureError);
              });
              throw error;
            } finally {
              await observer.settle();
              observer.stop();
              await writeEvidence(directory, evidence, observer.documents);
            }
          },
          Math.max(240000, updateCount * 15000),
        );
      }
    },
    {
      updates: scenario,
      publicRoutesOnly: true,
    },
  );
}

if (process.env.MF_LAB_MODE !== 'dev') {
  describeLab(
    'Static Weather Lab entries',
    getContext => {
      it('updates the weather entry while the homepage remains available with its original module cache', async () => {
        const { page, lab } = getContext();
        await page.goto(lab.url, { waitUntil: 'networkidle0' });
        const status = async () =>
          (await fetch(`${lab.url}/_lab/update/lab/status`)).json();
        const before = await status();
        const originalShell = before.entries.filter(record =>
          record.entry.startsWith('index'),
        );
        const documents = await exerciseUpdateRequestFrames(
          page,
          lab.url,
          'ordinary',
          async () => {
            const home = await fetch(lab.url, {
              signal: AbortSignal.timeout(2000),
            });
            expect(home.status).toBe(200);
            expect(home.headers.get('x-modernjs-render')).not.toBe('client');
            expect(await home.text()).toContain('SSR update checks');
          },
        );
        expect(documents.filter(item => item.policy === 'wait')).toHaveLength(
          2,
        );
        const after = await status();
        expect(after.pid).toBe(before.pid);
        expect(after.operation.result).toMatchObject({
          mode: 'entries',
          entries: ['weather'],
          reasons: [],
        });
        expect(
          after.entries.filter(record => record.entry.startsWith('index')),
        ).toEqual(originalShell);
        expect(
          after.entries.find(record => record.entry === 'weather').runtime,
        ).toBe(
          before.entries.find(record => record.entry === 'weather').runtime,
        );
        expect(
          after.entries.find(record => record.entry === 'weather').modules,
        ).not.toEqual(
          before.entries.find(record => record.entry === 'weather').modules,
        );
      });
    },
    {
      updates: 'bridge',
      publicRoutesOnly: true,
      partialUpdates: true,
      mode: 'production',
    },
  );

  describeLab(
    'Service producer internal SSR updates',
    getContext => {
      it('holds repeated Service renders for a nested dependency update and preserves the Host and producer processes', async () => {
        const { page, lab } = getContext();
        const route = `${lab.url}/service/forecast/today?remote=nested`;
        const control = async (action: string, body?: object) => {
          const response = await fetch(
            `${lab.url}/_lab/update/lab/producer/${action}`,
            body && {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            },
          );
          expect(response.ok).toBe(true);
          return response.json();
        };
        await page.goto(route, { waitUntil: 'networkidle0' });
        expect(
          await page.$eval(
            '[data-testid="service-remote-child"]',
            element => element.textContent,
          ),
        ).toContain('Rslib · v1');
        const before = await control('status');
        const hostBefore = await (
          await fetch(`${lab.url}/_lab/update/lab/status`)
        ).json();
        let completed = 0;
        const requests: Promise<string>[] = [];
        try {
          await control('start', { version: 'v2' });
          await expect
            .poll(async () => (await control('status')).operation?.held)
            .toBe(true);
          for (let request = 0; request < 3; request++)
            requests.push(
              fetch(`${route}&__labRequest=${request}&__labPolicy=wait`).then(
                async response => {
                  expect(response.status).toBe(200);
                  const html = await response.text();
                  completed++;
                  return html;
                },
              ),
            );
          await new Promise(resolve => setTimeout(resolve, 200));
          expect(completed).toBe(0);
          await control('policy', { policy: 'reject' });
          const rejected = await fetch(`${route}&__labRequest=rejected`);
          const errorStream = await rejected.text();
          // The Host shell has already been sent before the producer rejects.
          expect(rejected.status).toBe(200);
          expect(errorStream).toContain('"status":503');
          await control('policy', { policy: 'wait' });
          await control('release', {});
          for (const html of await Promise.all(requests)) {
            expect(html).toContain('Rslib · v2');
            expect(html).toContain('v1:initial');
            expect(html).not.toContain('"type":"error"');
          }
          await expect
            .poll(async () => (await control('status')).operation?.completed)
            .toBe(true);
          expect((await control('status')).pid).toBe(before.pid);
          expect(
            (await (await fetch(`${lab.url}/_lab/update/lab/status`)).json())
              .pid,
          ).toBe(hostBefore.pid);
          await page.goto(route, { waitUntil: 'networkidle0' });
          await page.waitForFunction(() =>
            document
              .querySelector('[data-testid="service-remote-child"]')
              ?.textContent?.includes('Rslib · v2'),
          );
          await page.click('[data-testid="service-remote-child"] h2');
          await page.waitForSelector(
            '[data-testid="service-remote-child"] input[type="range"]:not(:disabled)',
          );
          expect(
            await page.$eval(
              '[data-testid="service-remote-child"]',
              element => element.textContent,
            ),
          ).toContain('Rslib · v2');
          await page.focus(
            '[data-testid="service-remote-child"] input[type="range"]',
          );
          await page.keyboard.press('Home');
          await page.waitForFunction(
            () =>
              document.querySelector(
                '[data-testid="service-remote-child"] [data-testid="wind-angle"]',
              )?.textContent === '0°',
          );
          await page.click('[data-testid="save-day"]');
          await page.waitForFunction(
            () =>
              document.querySelector('[data-testid="favorite-count"]')
                ?.textContent === '1',
          );
        } finally {
          await control('release', {});
          await control('policy', { policy: 'wait' });
          await Promise.allSettled(requests);
        }
      });
    },
    {
      updates: 'ordinary',
      serviceNested: true,
      publicRoutesOnly: true,
      mode: 'production',
    },
  );
}
