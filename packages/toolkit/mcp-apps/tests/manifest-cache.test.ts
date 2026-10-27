import { it, expect, rs, beforeEach, afterEach } from '@rstest/core';
import { mkdtemp, writeFile, rename, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { McpServer } from '@modelcontextprotocol/server';
import { registerUiResources } from '../src/server/resources';

const initialEnv = process.env.NODE_ENV;
let directory: string;
beforeEach(async () => {
  process.env.NODE_ENV = 'development';
  directory = await mkdtemp(path.join(os.tmpdir(), 'mcp-cache-'));
});
afterEach(async () => {
  rs.restoreAllMocks();
  if (initialEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = initialEnv;
  await rm(directory, { recursive: true, force: true });
});
const manifest = (name = 'first') => ({
  version: 1,
  assetBase: 'https://assets.example/',
  remotes: {},
  views: { [name]: { html: './card.html', ui: {} } },
});
const register = (source: string | URL) =>
  registerUiResources(new McpServer({ name: 'cache-test', version: '1' }), {
    manifest: source,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
const remoteUrl = () =>
  `https://assets.example/${crypto.randomUUID()}/manifest.json`;

it('reuses production manifests without rereading files and separates development state', async () => {
  const filename = path.join(directory, 'manifest.json');
  await writeFile(filename, JSON.stringify(manifest()));
  process.env.NODE_ENV = 'production';
  expect(await register(filename)).toEqual({ first: 'ui://app/first' });
  await rm(filename);
  expect(await register(pathToFileURL(filename))).toEqual({
    first: 'ui://app/first',
  });
  process.env.NODE_ENV = 'development';
  await expect(register(filename)).rejects.toThrow('ENOENT');
});

it('reloads development files after atomic replacement and retries invalid content', async () => {
  const filename = path.join(directory, 'manifest.json');
  await writeFile(filename, JSON.stringify(manifest()));
  expect(await register(filename)).toEqual({ first: 'ui://app/first' });
  const replacement = path.join(directory, 'replacement.json');
  await writeFile(replacement, JSON.stringify(manifest('other')));
  await rename(replacement, filename);
  expect(await register(filename)).toEqual({ other: 'ui://app/other' });
  await writeFile(filename, '{');
  await expect(register(filename)).rejects.toThrow();
  await writeFile(filename, JSON.stringify(manifest('recovered')));
  expect(await register(filename)).toEqual({ recovered: 'ui://app/recovered' });
});

it('coalesces concurrent remote loads across servers and canonical URL representations', async () => {
  let finish!: (response: Response) => void;
  const response = new Promise<Response>(resolve => {
    finish = resolve;
  });
  const fetch = rs.spyOn(globalThis, 'fetch').mockReturnValue(response);
  const url = remoteUrl();
  const pending = [register(url), register(new URL(url)), register(url)];
  expect(fetch).toHaveBeenCalledTimes(1);
  finish(Response.json(manifest()));
  await Promise.all(pending);
  await register(url);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('refreshes development remote manifests after 60 seconds', async () => {
  let now = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => now);
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json(manifest()))
    .mockResolvedValueOnce(Response.json(manifest('updated')));
  const url = remoteUrl();
  await register(url);
  now += 59_999;
  expect(await register(url)).toEqual({ first: 'ui://app/first' });
  expect(fetch).toHaveBeenCalledTimes(1);
  now++;
  expect(await register(url)).toEqual({ updated: 'ui://app/updated' });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('keeps production remote manifests for the process lifetime', async () => {
  process.env.NODE_ENV = 'production';
  let now = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => now);
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json(manifest()));
  const url = remoteUrl();
  await register(url);
  now += 24 * 60 * 60 * 1000;
  await register(url);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each([
  () => new Response('Unavailable', { status: 503 }),
  () => new Response('{'),
  () => Response.json({ ...manifest(), version: 2 }),
])(
  'does not cache remote HTTP, JSON or validation failures',
  async failedResponse => {
    const fetch = rs
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(failedResponse())
      .mockResolvedValueOnce(Response.json(manifest()));
    const url = remoteUrl();
    await expect(register(url)).rejects.toThrow();
    expect(await register(url)).toEqual({ first: 'ui://app/first' });
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);

it('reuses parsed development manifests when file metadata is unchanged', async () => {
  const filename = path.join(directory, 'manifest.json');
  const contents = JSON.stringify(manifest(crypto.randomUUID()));
  await writeFile(filename, contents);
  const parse = rs.spyOn(JSON, 'parse');
  await register(filename);
  await register(pathToFileURL(filename));
  expect(parse.mock.calls.filter(([input]) => input === contents)).toHaveLength(
    1,
  );
});
