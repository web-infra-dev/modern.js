import { injectRSCPayload } from '../../src/rsc-html-stream/server';

async function readStreamAsText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

function createStreamFromChunks(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

describe('injectRSCPayload', () => {
  test('keeps flight scripts before closing tags when html trailer contains whitespace', async () => {
    const htmlStream = createStreamFromChunks([
      '<body><div>app</div>\n\n</body>\n</html>\n',
    ]);
    const rscStream = createStreamFromChunks(['payload']);

    const text = await readStreamAsText(
      htmlStream.pipeThrough(
        injectRSCPayload(rscStream, {
          injectClosingTags: true,
        }),
      ),
    );

    expect(text.match(/<\/body>/g)).toHaveLength(1);
    expect(text.match(/<\/html>/g)).toHaveLength(1);
    expect(
      text.lastIndexOf('<script>(self.__FLIGHT_DATA||=[]).push('),
    ).toBeLessThan(text.lastIndexOf('</body>'));
    expect(
      text.lastIndexOf('<script>(self.__FLIGHT_DATA||=[]).push('),
    ).toBeLessThan(text.lastIndexOf('</html>'));
    expect(text.trimEnd().endsWith('</html>')).toBe(true);
  });
});
