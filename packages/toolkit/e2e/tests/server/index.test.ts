import { readFileSync } from 'fs';
import got from 'got';
import { describe, expect, it } from 'vitest';
import { runStaticServer } from '../../src/server';

describe('runStaticServer', () => {
  it('should run static server', async () => {
    const { hostname, port } = await runStaticServer(__dirname);
    expect(port).toBeGreaterThan(0);
    expect(readFileSync(__filename, 'utf-8')).toEqual(
      await got(`http://${hostname}:${port}/index.test.ts`).text(),
    );
  });
});
