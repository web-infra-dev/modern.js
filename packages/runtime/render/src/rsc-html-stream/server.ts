/**
 * forked and modified from https://github.com/devongovett/rsc-html-stream/blob/main/server.js
 * license at https://github.com/devongovett/rsc-html-stream/blob/main/LICENSE
 */
const encoder = new TextEncoder();
const trailer = '</body></html>';

export function injectRSCPayload(
  rscStream: ReadableStream,
  {
    injectClosingTags = true,
  }: {
    injectClosingTags?: boolean;
  },
): TransformStream {
  const decoder = new TextDecoder();
  let resolveFlightDataPromise: (value: void) => void;
  const flightDataPromise = new Promise<void>(
    resolve => (resolveFlightDataPromise = resolve),
  );
  let startedRSC = false;

  // Buffer all HTML chunks enqueued during the current tick of the event loop (roughly)
  // and write them to the output stream all at once. This ensures that we don't generate
  // invalid HTML by injecting RSC in between two partial chunks of HTML.
  const buffered: Uint8Array[] = [];
  let timeout: NodeJS.Timeout | null = null;

  function flushBufferedChunks(
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    for (const chunk of buffered) {
      let buf = decoder.decode(chunk);
      if (buf.endsWith(trailer)) {
        buf = buf.slice(0, -trailer.length);
      }
      controller.enqueue(encoder.encode(buf));
    }

    buffered.length = 0;
    timeout = null;
  }

  return new TransformStream({
    transform(
      chunk: Uint8Array,
      controller: TransformStreamDefaultController<Uint8Array>,
    ) {
      buffered.push(chunk);
      if (timeout) {
        return;
      }

      timeout = setTimeout(async () => {
        flushBufferedChunks(controller);
        if (!startedRSC) {
          startedRSC = true;
          writeRSCStream(rscStream, controller)
            .catch(err => controller.error(err))
            .then(() => resolveFlightDataPromise());
        }
      }, 0);
    },
    async flush(controller: TransformStreamDefaultController<Uint8Array>) {
      await flightDataPromise;
      if (timeout) {
        clearTimeout(timeout);
        flushBufferedChunks(controller);
      }
      if (injectClosingTags) {
        controller.enqueue(encoder.encode('</body></html>'));
      }
    },
  });
}

async function writeRSCStream(
  rscStream: ReadableStream,
  controller: TransformStreamDefaultController,
): Promise<void> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  // @ts-ignore
  for await (const chunk of rscStream) {
    // Try decoding the chunk to send as a string.
    // If that fails (e.g. binary data that is invalid unicode), write as base64.
    try {
      writeChunk(
        JSON.stringify(decoder.decode(chunk, { stream: true })),
        controller,
      );
    } catch (err) {
      const base64 = JSON.stringify(btoa(String.fromCodePoint(...chunk)));
      writeChunk(
        `Uint8Array.from(atob(${base64}), m => m.codePointAt(0))`,
        controller,
      );
    }
  }

  const remaining = decoder.decode();
  if (remaining.length) {
    writeChunk(JSON.stringify(remaining), controller);
  }
}

function writeChunk(
  chunk: string,
  controller: TransformStreamDefaultController<Uint8Array>,
): void {
  controller.enqueue(
    encoder.encode(
      `<script>${escapeScript(`(self.__FLIGHT_DATA||=[]).push(${chunk})`)}</script>`,
    ),
  );
}

// Escape closing script tags and HTML comments in JS content.
// https://www.w3.org/TR/html52/semantics-scripting.html#restrictions-for-contents-of-script-elements
// Avoid replacing </script with <\/script as it would break the following valid JS: 0</script/ (i.e. regexp literal).
// Instead, escape the s character.
function escapeScript(script: string): string {
  return script.replace(/<!--/g, '<\\!--').replace(/<\/(script)/gi, '</\\$1');
}

/**
 * Inject CSS link tags into HTML stream before closing head tag
 */
export function injectCSS(
  cssFiles: string[],
  {
    injectClosingTags = true,
  }: {
    injectClosingTags?: boolean;
  } = {},
): TransformStream {
  if (cssFiles.length === 0) {
    // Return a pass-through stream if no CSS files
    return new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush(controller) {
        if (injectClosingTags) {
          controller.enqueue(encoder.encode('</body></html>'));
        }
      },
    });
  }

  const decoder = new TextDecoder();
  const headTrailer = '</head>';
  const bodyTrailer = '</body>';

  // Buffer all HTML chunks enqueued during the current tick of the event loop (roughly)
  // and write them to the output stream all at once. This ensures that we don't generate
  // invalid HTML by injecting CSS in between two partial chunks of HTML.
  const buffered: Uint8Array[] = [];
  let timeout: NodeJS.Timeout | null = null;
  let cssInjected = false;

  const cssLinks = cssFiles
    .map(css => `<link href="${css}" rel="stylesheet" />`)
    .join('');

  function flushBufferedChunks(
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    for (const chunk of buffered) {
      let buf = decoder.decode(chunk);

      // Try to inject CSS before </head> first
      if (!cssInjected && buf.includes(headTrailer)) {
        buf = buf.replace(headTrailer, `${cssLinks}${headTrailer}`);
        cssInjected = true;
      }

      controller.enqueue(encoder.encode(buf));
    }

    buffered.length = 0;
    timeout = null;
  }

  return new TransformStream({
    transform(
      chunk: Uint8Array,
      controller: TransformStreamDefaultController<Uint8Array>,
    ) {
      buffered.push(chunk);
      if (timeout) {
        return;
      }

      timeout = setTimeout(() => {
        flushBufferedChunks(controller);
      }, 0);
    },
    async flush(controller: TransformStreamDefaultController<Uint8Array>) {
      if (timeout) {
        clearTimeout(timeout);
        flushBufferedChunks(controller);
      }

      // If CSS hasn't been injected yet, inject it before closing tags
      if (!cssInjected) {
        controller.enqueue(encoder.encode(cssLinks));
      }

      if (injectClosingTags) {
        controller.enqueue(encoder.encode('</body></html>'));
      }
    },
  });
}
