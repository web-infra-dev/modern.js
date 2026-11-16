import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'puppeteer';
import type { DocumentEvidence } from './update-evidence';

// This shared source is compiled by Rslib, then consumed through a nested
// Modern producer. Editing only a direct Modern expose misses this graph.
export async function verifyNestedWindUpdate(
  page: Page,
  workspace: string,
  documents: DocumentEvidence[],
) {
  const source = path.join(workspace, 'provider/src/weather-ui.tsx');
  const original = await readFile(source, 'utf8');
  const match = original.match(/Speed <b>(\d+) km\/h<\/b>/);
  if (!match) throw new Error('Missing editable wind speed in fixture source');
  const nextSpeed = String(Number(match[1]) + 1);
  const changed = original.replace(match[0], `Speed <b>${nextSpeed} km/h</b>`);
  const assertWind = async (speed: string) => {
    await page.waitForFunction(
      expected => {
        const frames = [
          ...document.querySelectorAll<HTMLIFrameElement>(
            '.comparison-panel iframe',
          ),
        ];
        return (
          frames.length === 2 &&
          frames.every(
            frame =>
              frame.contentDocument?.querySelector(
                '[data-testid="weather-wind"] .wind-body b',
              )?.textContent === `${expected} km/h` &&
              frame.contentDocument?.querySelector(
                '[data-testid="weather-wind"] input:not(:disabled)',
              ),
          )
        );
      },
      { polling: 100, timeout: 60000 },
      speed,
    );
    const url = await page.$eval(
      '[data-testid="ssr-frame"]',
      frame => (frame as HTMLIFrameElement).contentWindow!.location.href,
    );
    expect(new URL(url).searchParams.has('csr')).toBe(false);
    const document: DocumentEvidence = { url, status: 0 };
    documents.push(document);
    await expect
      .poll(
        async () => {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(15000),
          });
          document.status = response.status;
          document.html = await response.text();
          return (
            response.status === 200 &&
            document.html.includes(`Speed <b>${speed} km/h</b>`) &&
            !document.html.includes('Switched to client rendering')
          );
        },
        { timeout: 60000 },
      )
      .toBe(true);
  };
  await assertWind(match[1]);
  try {
    await writeFile(source, changed);
    // No test navigation or manual refresh after either source edit.
    await assertWind(nextSpeed);
  } finally {
    await writeFile(source, original);
    await assertWind(match[1]);
  }
}
