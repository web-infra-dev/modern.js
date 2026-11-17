import { describeLab } from './fixture';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertInteraction,
  assertServerVersion,
  scenarioRoutes,
} from './update-evidence';

describeLab(
  'Service independent deployment',
  getContext => {
    if (getContext().mode !== 'production') return;
    it('renders and hydrates the current deployment without updating the Host snapshot', async () => {
      const { page, lab } = getContext();
      const discovery = `http://localhost:${lab.ports.api}/service-deployment/mf-manifest.json`;
      const initial = await (await fetch(discovery)).json();
      await page.goto(`${lab.url}${scenarioRoutes.service}`, {
        waitUntil: 'networkidle0',
      });
      await assertInteraction(page, 'service', 'v1:initial');
      for (const version of ['v2', 'v1', 'v2']) {
        const selected = await fetch(
          `http://localhost:${lab.ports.api}/service-deployment/select?version=${version}`,
          { method: 'POST' },
        );
        expect(selected.status).toBe(204);
        const response = await page.goto(
          `${lab.url}${scenarioRoutes.service}`,
          { waitUntil: 'networkidle0' },
        );
        assertServerVersion(
          await response!.text(),
          'service',
          `${version}:initial`,
        );
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
        await assertInteraction(page, 'service', `${version}:initial`);
        // The manifest remains V1. Only the Service endpoint's deployment changed.
        expect(await (await fetch(discovery)).json()).toEqual(initial);
      }
    });
  },
  { updates: 'service', serviceDeployment: true, publicRoutesOnly: true },
);

describeLab(
  'Service internal SSR dependencies',
  getContext => {
    for (const kind of ['plain', 'nested']) {
      it(`streams and hydrates ${kind} SSR with the selected dependency snapshots`, async () => {
        const { page, lab } = getContext();
        const response = await page.goto(
          `${lab.url}${scenarioRoutes.service}?remote=${kind}`,
          { waitUntil: 'networkidle0' },
        );
        const html = await response!.text();
        assertServerVersion(html, 'service', 'v1:initial');
        const frames = [
          ...html.matchAll(
            /accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[^\n]*?\])\)<\/script>/g,
          ),
        ].map(match => JSON.parse(match[1])[1]);
        const descriptions = frames.filter(
          frame => frame.type === 'meta' || frame.type === 'client',
        );
        const names = descriptions
          .at(-1)
          .client.dependencies.map((item: { name: string }) => item.name);
        expect(names).toContain('lab_library');
        if (kind === 'nested') expect(names).toContain('lab_nested');
        await page.waitForSelector(
          '[data-testid="service-remote-child"] [data-testid="weather-wind"]',
        );
        expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
        await assertInteraction(page, 'service', 'v1:initial');
      });
    }
    if (getContext().mode === 'dev') {
      it('updates only the nested Rslib producer without rebuilding the Service or reloading its document', async () => {
        const { page, lab, workspace } = getContext();
        await page.goto(`${lab.url}${scenarioRoutes.service}?remote=nested`, {
          waitUntil: 'networkidle0',
        });
        const timeOrigin = await page.evaluate(() => performance.timeOrigin);
        const manifestUrl = `http://localhost:${lab.ports.provider}/static/mf-manifest.json`;
        const before = await (await fetch(manifestUrl)).json();
        const source = path.join(workspace, 'library/src/WeatherWind.tsx');
        const original = await readFile(source, 'utf8');
        const marker = 'Service nested C update';
        const changed = original.replace(
          'export default withRenderFailure(WindWeather);',
          `export default withRenderFailure(function Wind(props: Parameters<typeof WindWeather>[0]) { return <WindWeather {...props} attribution=${JSON.stringify(marker)} />; });`,
        );
        expect(changed).not.toBe(original);
        try {
          await writeFile(source, changed);
          await page.waitForFunction(
            text =>
              document
                .querySelector('[data-testid="service-remote-child"]')
                ?.textContent?.includes(text),
            { timeout: 60000 },
            marker,
          );
          expect(await page.evaluate(() => performance.timeOrigin)).toBe(
            timeOrigin,
          );
          expect(
            (await (await fetch(manifestUrl)).json()).metaData.buildInfo
              .buildVersion,
          ).toBe(before.metaData.buildInfo.buildVersion);
          const response = await fetch(
            `${lab.url}${scenarioRoutes.service}?remote=nested&manual=1`,
          );
          const html = await response.text();
          expect(response.status).toBe(200);
          expect(html).toContain(marker);
          expect(html).not.toContain('Bridge server rendering failed');
        } finally {
          if ((await readFile(source, 'utf8')) === changed)
            await writeFile(source, original);
        }
      }, 120000);
    }
  },
  { updates: 'ordinary', serviceNested: true, publicRoutesOnly: true },
);
