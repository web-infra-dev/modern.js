import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = new URL(process.argv[2] || 'http://localhost:8080');
const outputDirectory = process.argv[3]
  ? path.resolve(process.argv[3])
  : undefined;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function decodeEntities(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,
    (_, entity) => {
      if (entity[0] === '#') {
        return String.fromCodePoint(
          entity[1].toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10),
        );
      }
      return named[entity.toLowerCase()];
    },
  );
}

function readHead(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  assert.ok(head, 'The HTTP response must include an HTML head');
  // Inspect only HTML markup, never metadata strings inside scripts or comments.
  const markup = head
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const meta = new Map();
  const canonical = [];
  for (const tag of markup.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const attributes = Object.fromEntries(
      [
        ...tag[0].matchAll(
          /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
        ),
      ].map(([, name, doubleQuoted, singleQuoted, unquoted]) => [
        name.toLowerCase(),
        decodeEntities(doubleQuoted ?? singleQuoted ?? unquoted),
      ]),
    );
    if (tag[1].toLowerCase() === 'meta') {
      const name = attributes.property || attributes.name;
      if (!name) continue;
      assert.ok(!meta.has(name), `Duplicate metadata: ${name}`);
      meta.set(name, attributes.content);
    } else if (attributes.rel?.toLowerCase() === 'canonical') {
      canonical.push(attributes.href);
    }
  }
  return { meta, canonical };
}

async function request(url) {
  return fetch(url, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });
}

function absoluteUrl(value, name) {
  assert.ok(value, `Missing ${name}`);
  const url = new URL(value);
  assert.ok(
    ['http:', 'https:'].includes(url.protocol),
    `${name} must use HTTP(S)`,
  );
  assert.equal(
    url.origin,
    baseUrl.origin,
    `${name} must use the configured site origin`,
  );
  return url;
}

async function verifyArticle(slug) {
  const pageUrl = new URL(`/posts/${slug}`, baseUrl);
  const response = await request(pageUrl);
  assert.equal(response.status, 200, `${slug}: page status`);
  assert.match(response.headers.get('content-type') || '', /^text\/html\b/i);
  const html = await response.text();
  const { meta, canonical } = readHead(html);
  for (const name of ['og:title', 'og:description', 'og:image:alt', 'author']) {
    assert.ok(
      meta.get(name)?.trim(),
      `${slug}: missing ${name} in the initial HTML head`,
    );
  }
  assert.equal(meta.get('description'), meta.get('og:description'));
  assert.equal(meta.get('og:type'), 'article');
  assert.equal(meta.get('og:image:type'), 'image/png');
  assert.equal(meta.get('og:image:width'), '1200');
  assert.equal(meta.get('og:image:height'), '630');
  assert.equal(meta.get('twitter:card'), 'summary_large_image');
  assert.equal(meta.get('twitter:image'), meta.get('og:image'));
  assert.equal(absoluteUrl(meta.get('og:url'), 'og:url').href, pageUrl.href);
  assert.equal(canonical.length, 1, 'Expected one canonical URL');
  assert.equal(absoluteUrl(canonical[0], 'canonical').href, pageUrl.href);

  const imageUrl = absoluteUrl(meta.get('og:image'), 'og:image');
  const imageResponse = await request(imageUrl);
  assert.equal(imageResponse.status, 200, `${slug}: image status`);
  assert.match(
    imageResponse.headers.get('content-type') || '',
    /^image\/png(?:;|$)/i,
  );
  const cacheControl = imageResponse.headers.get('cache-control') || '';
  assert.match(
    cacheControl,
    /(?:^|,)\s*public\b/i,
    'Images should be publicly cacheable',
  );
  assert.match(cacheControl, /(?:^|,)\s*max-age=[1-9]\d*\b/i);
  assert.match(cacheControl, /(?:^|,)\s*s-maxage=[1-9]\d*\b/i);
  assert.doesNotMatch(cacheControl, /\b(?:no-store|private)\b/i);
  const png = Buffer.from(await imageResponse.arrayBuffer());
  assert.ok(png.length >= 45, `${slug}: truncated PNG`);
  assert.deepEqual(png.subarray(0, 8), pngSignature, `${slug}: PNG signature`);
  assert.equal(png.readUInt32BE(8), 13, `${slug}: IHDR length`);
  assert.equal(png.toString('ascii', 12, 16), 'IHDR', `${slug}: IHDR chunk`);
  assert.equal(png.readUInt32BE(16), 1200, `${slug}: PNG width`);
  assert.equal(png.readUInt32BE(20), 630, `${slug}: PNG height`);
  assert.equal(png.toString('ascii', png.length - 8, png.length - 4), 'IEND');

  if (outputDirectory) {
    await Promise.all([
      writeFile(path.join(outputDirectory, `${slug}.png`), png),
      writeFile(path.join(outputDirectory, `${slug}.html`), html),
    ]);
  }
  console.log(
    `PASS ${pageUrl.pathname}: initial HTML metadata and 1200 × 630 PNG (${png.length} bytes)`,
  );
  return png;
}

async function main() {
  if (outputDirectory) await mkdir(outputDirectory, { recursive: true });
  const first = await verifyArticle('hello-modern');
  const second = await verifyArticle('long-title');
  assert.ok(
    !first.equals(second),
    'Different articles must produce different images',
  );

  const missingPage = await request(new URL('/posts/does-not-exist', baseUrl));
  assert.equal(missingPage.status, 404, 'Unknown article status');
  const { meta } = readHead(await missingPage.text());
  assert.ok(
    !meta.has('og:image'),
    'Unknown articles must not advertise an OG image',
  );
  assert.match(meta.get('robots') || '', /\bnoindex\b/i);
  console.log('PASS unknown article: HTTP 404, no OG image, noindex');

  const missingImage = await request(
    new URL('/api/og/does-not-exist', baseUrl),
  );
  assert.equal(missingImage.status, 404, 'Unknown image status');
  assert.match(
    missingImage.headers.get('cache-control') || '',
    /\bno-store\b/i,
  );
  await missingImage.arrayBuffer();
  console.log('PASS unknown image: HTTP 404 and no-store');
  console.log(
    `Verified ${baseUrl.origin}${outputDirectory ? ` • saved previews and HTML to ${outputDirectory}` : ''}`,
  );
}

main().catch(error => {
  console.error('OG image verification failed:', error);
  process.exitCode = 1;
});
