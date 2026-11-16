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
  waitForVersion,
  writeEvidence,
  type MemoryRound,
  type DocumentEvidence,
} from './update-evidence';

for (const scenario of scenarios) {
  describeLab(
    `Producer updates / ${scenario}`,
    getContext => {
      if (getContext().mode === 'dev') {
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
          const observer = observeDocuments(page);
          const evidence: Record<string, unknown> = {
            mode: 'dev',
            scenario,
            completed: false,
          };
          try {
            evidence.phase = 'open-shell';
            await page.goto(`${lab.url}/updates?scenario=${scenario}`, {
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
            const originalFrameSource = await page.$eval(
              '[data-testid="update-frame"]',
              element => element.getAttribute('src'),
            );
            const documentCount = observer.documents.length;

            // No test navigation, page.reload or iframe src assignment follows
            // this edit. The existing dev subscription / HMR owns the refresh.
            evidence.phase = 'edit-producer-and-wait-for-automatic-refresh';
            await writeFile(source, changed);
            const updatedFrame = await waitForVersion(page, 'v1:updated');
            evidence.phase = 'updated-interaction';
            await assertInteraction(page, scenario, 'v1:updated');
            expect(page.url()).toBe(shellUrl);
            expect(
              await page.$eval('[data-testid="update-frame"]', element =>
                element.getAttribute('src'),
              ),
            ).toBe(originalFrameSource);
            expect(new URL(updatedFrame.url()).searchParams.has('csr')).toBe(
              false,
            );
            evidence.phase = 'automatic-documents-contain-new-ssr';
            await observer.settle();
            // Fast Refresh can retain the document. A superseding dev reload
            // may cancel a navigation, but each completed document must be new SSR.
            const automaticDocuments = observer.documents.slice(documentCount);
            const completedDocuments: DocumentEvidence[] = [];
            for (const document of automaticDocuments) {
              expect(new URL(document.url).searchParams.has('csr')).toBe(false);
              if (document.requestFailure === 'net::ERR_ABORTED') continue;
              expect(document.requestFailure).toBeUndefined();
              expect(document.error).toBeUndefined();
              expect(document.status).toBe(200);
              expect(typeof document.html).toBe('string');
              assertServerVersion(document.html!, scenario, 'v1:updated');
              completedDocuments.push(document);
            }
            if (automaticDocuments.length)
              expect(
                completedDocuments.some(
                  document => document.url === updatedFrame.url(),
                ),
              ).toBe(true);

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
        it('switches two built producers ten times and records post-GC memory', async () => {
          const { page, lab } = getContext();
          const directory = await artifactDirectory('production', scenario);
          const observer = observeDocuments(page);
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
              'Memory is measured after warming both versions and running ten successful SSR updates. Baseline and final medians, ranges and per-round samples are reported without an assumed leak threshold. RSS may retain allocated pages after GC.',
          };
          try {
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
            await page.goto(`${lab.url}/updates?scenario=${scenario}`, {
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
            const initialRenders = Number(
              await page.$eval(
                '[data-testid="update-renders"]',
                element => element.textContent,
              ),
            );

            for (let index = 0; index < 10; index++) {
              const version = index % 2 === 0 ? 'v2' : 'v1';
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
              rounds.push({ label: `update-${index + 1}-${version}`, samples });
              evidence.completedUpdates = index + 1;
              // Keep completed rounds if a later update or process crashes.
              await writeEvidence(
                directory,
                evidence,
                observer.documents,
                false,
              );
            }
            expect(
              Number(
                await page.$eval(
                  '[data-testid="update-renders"]',
                  element => element.textContent,
                ),
              ) - initialRenders,
            ).toBe(10);
            expect(evidence.completedUpdates).toBe(10);
            for (let index = 0; index < 3; index++) {
              evidence.phase = `final-${index + 1}-gc`;
              const samples = await memorySample(lab.url);
              assertSameProcesses(identities, samples);
              final.push({ label: `final-${index + 1}`, samples });
            }
            const comparison = compareMemory(baseline, rounds, final);
            evidence.comparison = comparison;
            // The same samples are accessible to a person reviewing the shell.
            evidence.phase = 'shell-memory-table';
            await page.click('[data-testid="update-memory"]');
            await page.waitForSelector('[data-testid="update-memory-table"]');
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
            await observer.settle();
            observer.stop();
            await writeEvidence(directory, evidence, observer.documents);
          }
        }, 240000);
      }
    },
    {
      updates: scenario,
      publicRoutesOnly: true,
    },
  );
}
