import { Readable } from 'stream';
import { storage } from '@modern-js/runtime-utils/node';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../src/common';
import { setGlobalInternalRuntimeContext } from '../../src/core/context';
import { createReadableStreamFromElement } from '../../src/core/server/stream/createReadableStream';
import { createShellEndMarkSplitter } from '../../src/core/server/stream/shared';

const SHELL_BEFORE = '<html><body><div id="root">';
const SHELL_AFTER = '</div></body></html>';
const HTML_TEMPLATE = `${SHELL_BEFORE}<!--<?- html ?>-->${SHELL_AFTER}`;

// Multi-byte characters sit right next to the marker, and a partial marker
// shows up first so the search has to recover from a near match.
const SHELL = `<p>${'壳 shell 🚀 '.repeat(8)}</p><p>&lt;!--&lt;?- SHELL_STREAM</p><b>中文🚀</b>`;
const AFTER_SHELL =
  '🎉<div hidden id="S:0">延迟内容</div><script>$RC("B:0","S:0")</script>';
const DOCUMENT = Buffer.from(
  `${SHELL}${ESCAPED_SHELL_STREAM_END_MARK}${AFTER_SHELL}`,
);
const EXPECTED = `${SHELL_BEFORE}${SHELL}${SHELL_AFTER}${AFTER_SHELL}`;

function chunkBy(buffer: Buffer, size: number): Buffer[] {
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < buffer.length; offset += size) {
    chunks.push(buffer.subarray(offset, offset + size));
  }
  return chunks;
}

function getChunkings(buffer: Buffer): Buffer[][] {
  const chunkings = [1, 2, 3, 5, 7, 16, 41, 64, buffer.length].map(size =>
    chunkBy(buffer, size),
  );
  // Two chunks split at every byte offset, including inside the marker and
  // inside multi-byte UTF-8 characters.
  for (let offset = 1; offset < buffer.length; offset++) {
    chunkings.push([buffer.subarray(0, offset), buffer.subarray(offset)]);
  }
  return chunkings;
}

const options = {
  runtimeContext: {
    ssrContext: {
      request: { pathname: '/', url: 'http://localhost/' },
    },
  },
  config: {},
  ssrConfig: {},
  htmlTemplate: HTML_TEMPLATE,
  entryName: 'main',
  onError: () => {},
} as any;

/**
 * Streams `chunks` through `createReadableStreamFromElement`. The React output
 * is swapped for `chunks` by a `processStream` extender, so the chunk
 * boundaries are fully controlled by the test.
 */
async function renderChunks(chunks: Buffer[]) {
  setGlobalInternalRuntimeContext({
    hooks: {
      extendStreamSSR: {
        call: () => [
          {
            processStream: (reactStream: NodeJS.ReadWriteStream) => {
              reactStream.resume();
              return Readable.from(chunks);
            },
          },
        ],
      },
    },
  } as any);

  const stream = await storage.run(
    { activeDeferreds: new Map(), deferredScriptKeys: new Map() },
    () =>
      createReadableStreamFromElement(
        new Request('http://localhost/'),
        <div />,
        options,
      ),
  );
  return new Response(stream).text();
}

/**
 * Records how many characters each search for the shell end marker scans.
 */
async function recordMarkerSearchLengths(fn: () => Promise<unknown>) {
  const originalIndexOf = String.prototype.indexOf;
  const searchLengths: number[] = [];
  String.prototype.indexOf = function (
    this: string,
    searchString: string,
    position?: number,
  ) {
    if (searchString === ESCAPED_SHELL_STREAM_END_MARK) {
      searchLengths.push(this.length - (position ?? 0));
    }
    return originalIndexOf.call(this, searchString, position);
  };
  try {
    await fn();
  } finally {
    String.prototype.indexOf = originalIndexOf;
  }
  return searchLengths;
}

describe('createShellEndMarkSplitter', () => {
  function split(chunks: string[]) {
    const splitAtShellEndMark = createShellEndMarkSplitter();
    for (let index = 0; index < chunks.length; index++) {
      const shell = splitAtShellEndMark(chunks[index]);
      if (shell) {
        return {
          beforeMark: shell.beforeMark,
          afterMark: shell.afterMark + chunks.slice(index + 1).join(''),
        };
      }
    }
    return undefined;
  }

  test('splits at the marker for every chunk boundary', () => {
    const text = DOCUMENT.toString();
    const chunkings: string[][] = [];
    for (let size = 1; size <= text.length; size++) {
      const chunks: string[] = [];
      for (let offset = 0; offset < text.length; offset += size) {
        chunks.push(text.slice(offset, offset + size));
      }
      chunkings.push(chunks);
    }
    for (let first = 0; first <= text.length; first++) {
      for (let second = first; second <= text.length; second += 7) {
        chunkings.push([
          text.slice(0, first),
          text.slice(first, second),
          text.slice(second),
        ]);
      }
    }

    for (const chunks of chunkings) {
      expect(split(chunks)).toEqual({
        beforeMark: SHELL,
        afterMark: AFTER_SHELL,
      });
    }
  });

  test('splits at the first marker only', () => {
    const marker = ESCAPED_SHELL_STREAM_END_MARK;
    expect(split(['a', `${marker}b${marker}`, 'c'])).toEqual({
      beforeMark: 'a',
      afterMark: `b${marker}c`,
    });
    expect(split([`${marker}`])).toEqual({ beforeMark: '', afterMark: '' });
  });

  test('keeps buffering while the marker is missing', () => {
    expect(split([SHELL])).toBe(undefined);
    expect(split([SHELL, ESCAPED_SHELL_STREAM_END_MARK.slice(0, -1)])).toBe(
      undefined,
    );
  });
});

describe('createReadableStreamFromElement shell end marker', () => {
  test('produces the same document for every chunking', async () => {
    // Includes chunks that end inside the multi-byte character right after the
    // marker, which the streaming decoder has to carry over to the next chunk.
    for (const chunks of getChunkings(DOCUMENT)) {
      expect(await renderChunks(chunks)).toBe(EXPECTED);
    }
  });

  test('searches each shell chunk once instead of the whole buffered shell', async () => {
    const chunkSize = 4096;
    const shell = `<div>${'<p>shell content 🚀</p>'.repeat(10_000)}</div>`;
    const document = Buffer.from(
      `${shell}${ESCAPED_SHELL_STREAM_END_MARK}<p>after</p>`,
    );

    let html = '';
    const searchLengths = await recordMarkerSearchLengths(async () => {
      html = await renderChunks(chunkBy(document, chunkSize));
    });

    expect(html).toBe(`${SHELL_BEFORE}${shell}${SHELL_AFTER}<p>after</p>`);
    expect(searchLengths.length).toBeGreaterThan(50);
    expect(Math.max(...searchLengths)).toBeLessThan(
      chunkSize + ESCAPED_SHELL_STREAM_END_MARK.length,
    );
  });
});
