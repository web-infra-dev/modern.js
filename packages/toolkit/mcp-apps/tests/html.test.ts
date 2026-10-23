import { readHtmlSource } from '../src/ui/resources';

describe('UI HTML loading', () => {
  it('cancels an in-flight HTTPS read when the caller aborts', async () => {
    const controller = new AbortController();
    const reason = new Error('Request cancelled');
    const fetch = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (_url, init) => {
        const signal = init!.signal!;
        controller.abort(reason);
        signal.throwIfAborted();
        return new Response('');
      });
    try {
      await expect(
        readHtmlSource('https://example.com/view.html', {
          signal: controller.signal,
        }),
      ).rejects.toBe(reason);
    } finally {
      fetch.mockRestore();
    }
  });

  it('rejects an already cancelled file read before accessing the file', async () => {
    const reason = new Error('Request cancelled');
    await expect(
      readHtmlSource('/missing/view.html', {
        signal: AbortSignal.abort(reason),
      }),
    ).rejects.toBe(reason);
  });
});
