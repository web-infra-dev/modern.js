type ServerCallback = (id: string, args: unknown[]) => Promise<unknown>;

const mockSetServerCallback = jest.fn();
const mockCreateTemporaryReferenceSet = jest.fn(() => ({ ref: 'temp-ref' }));
const mockEncodeReply = jest.fn(async (args: unknown[]) => ({
  encodedArgs: args,
}));
const mockCreateFromFetch = jest.fn(() => ({ type: 'decoded-rsc-response' }));

jest.mock(
  'rsc-mf-react-server-dom-client-browser',
  () => ({
    setServerCallback: mockSetServerCallback,
    createTemporaryReferenceSet: mockCreateTemporaryReferenceSet,
    encodeReply: mockEncodeReply,
    createFromFetch: mockCreateFromFetch,
  }),
  { virtual: true },
);
jest.mock(
  'react-server-dom-rspack/client.browser',
  () => {
    throw new Error(
      'registerServerCallback must import rsc-mf-react-server-dom-client-browser alias',
    );
  },
  { virtual: true },
);

const importRegisterHelper = async () =>
  import('../remote/src/runtime/registerServerCallback');

describe('registerRemoteServerCallback runtime behavior', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    mockSetServerCallback.mockReset();
    mockCreateTemporaryReferenceSet.mockClear();
    mockEncodeReply.mockClear();
    mockCreateFromFetch.mockClear();
    global.fetch = jest.fn(async () => ({ ok: true }) as Response);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const getRegisteredCallback = () => {
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);
    const callback = mockSetServerCallback.mock.calls[0]?.[0] as
      | ServerCallback
      | undefined;
    expect(typeof callback).toBe('function');
    return callback as ServerCallback;
  };

  it('registers callback and forwards raw action ids with bridge prefix', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root?debug=1#hash',
      'rscRemote',
    );

    const callback = getRegisteredCallback();
    await callback('abc123', ['arg-1', { nested: true }]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Accept: 'text/x-component',
          'x-rsc-action': 'remote:rscRemote:abc123',
        }),
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledWith(
      ['arg-1', { nested: true }],
      expect.objectContaining({
        temporaryReferences: expect.any(Object),
      }),
    );
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('throws when callback fetch returns non-ok response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response;
    });

    const callback = getRegisteredCallback();
    await expect(callback('fetch-failure-action', ['arg-1'])).rejects.toThrow(
      'Remote action callback request failed with status 503 Service Unavailable (http://127.0.0.1:3008/server-component-root).',
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockCreateFromFetch).not.toHaveBeenCalled();
  });

  it('retries once when callback fetch returns retryable 5xx response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-retry-5xx-action', ['arg-1']),
    ).resolves.toEqual(
      expect.objectContaining({
        type: 'decoded-rsc-response',
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('retries once when callback fetch returns retryable 429 response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-retry-429-action', ['arg-1']),
    ).resolves.toEqual(
      expect.objectContaining({
        type: 'decoded-rsc-response',
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('throws after retry when callback fetch stays at retryable 429 response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response;
    });

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-retry-429-fail-action', ['arg-1']),
    ).rejects.toThrow(
      'Remote action callback request failed with status 429 Too Many Requests (http://127.0.0.1:3008/server-component-root).',
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).not.toHaveBeenCalled();
  });

  it('retries once when callback fetch returns retryable 408 response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 408,
        statusText: 'Request Timeout',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-retry-408-action', ['arg-1']),
    ).resolves.toEqual(
      expect.objectContaining({
        type: 'decoded-rsc-response',
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('retries once when callback fetch returns retryable 425 response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 425,
        statusText: 'Too Early',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-retry-425-action', ['arg-1']),
    ).resolves.toEqual(
      expect.objectContaining({
        type: 'decoded-rsc-response',
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry callback fetch for non-retryable 4xx response', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response;
    });

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-non-retryable-action', ['arg-1']),
    ).rejects.toThrow(
      'Remote action callback request failed with status 400 Bad Request (http://127.0.0.1:3008/server-component-root).',
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockCreateFromFetch).not.toHaveBeenCalled();
  });

  it('retries once when callback fetch throws and succeeds on retry', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');

    const transientNetworkError = new Error('network-down-on-first-attempt');
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(transientNetworkError)
      .mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const callback = getRegisteredCallback();
    await expect(callback('fetch-retry-action', ['arg-1'])).resolves.toEqual(
      expect.objectContaining({
        type: 'decoded-rsc-response',
      }),
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).toHaveBeenCalledTimes(1);
  });

  it('throws network error after retry budget is exhausted', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('network-down-first-attempt'))
      .mockRejectedValueOnce(new Error('network-down-second-attempt'));

    const callback = getRegisteredCallback();
    await expect(
      callback('fetch-network-failure-action', ['arg-1']),
    ).rejects.toThrow(
      'Remote action callback request failed due to network error (http://127.0.0.1:3008/server-component-root): Error: network-down-second-attempt',
    );
    expect(mockCreateTemporaryReferenceSet).toHaveBeenCalledTimes(1);
    expect(mockEncodeReply).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstFetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body;
    const secondFetchBody = (global.fetch as jest.Mock).mock.calls[1]?.[1]
      ?.body;
    expect(firstFetchBody).toBe(secondFetchBody);
    expect(mockCreateFromFetch).not.toHaveBeenCalled();
  });

  it('uses default alias when remote alias is omitted', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');

    const callback = getRegisteredCallback();
    await callback('default-alias-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:default-alias-action',
        }),
      }),
    );
  });

  it('normalizes action ids and rejects whitespace-delimited ids', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008/server-component-root');

    const callback = getRegisteredCallback();
    await callback('   abc123   ', []);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:abc123',
        }),
      }),
    );

    await expect(callback('abc 123', [])).rejects.toThrow(
      'Remote action id must be a non-empty token without whitespace',
    );
    await expect(callback('   ', [])).rejects.toThrow(
      'Remote action id must be a non-empty token without whitespace',
    );
  });

  it('preserves already-prefixed action ids and dedupes normalized callback registrations', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root?first=1',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root#second',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('remote:rscRemote:already-prefixed', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:already-prefixed',
        }),
      }),
    );
  });

  it('dedupes callback registrations when only trailing slash differs', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root/',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('slash-normalized-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:slash-normalized-action',
        }),
      }),
    );
  });

  it('dedupes callback registrations when trailing slash and URL fragments differ', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root/?cache=1#first',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root#second',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('slash-fragment-normalized-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:slash-fragment-normalized-action',
        }),
      }),
    );
  });

  it('dedupes callback registrations when only default http port differs', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:80/server-component-root',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1/server-component-root',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('default-http-port-normalized-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action':
            'remote:rscRemote:default-http-port-normalized-action',
        }),
      }),
    );
  });

  it('dedupes callback registrations when only default https port differs', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'https://example.com:443/server-component-root',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'https://example.com/server-component-root',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('default-https-port-normalized-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action':
            'remote:rscRemote:default-https-port-normalized-action',
        }),
      }),
    );
  });

  it('dedupes root callback registrations for origin with and without slash', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('http://127.0.0.1:3008', 'rscRemote');
    registerRemoteServerCallback('http://127.0.0.1:3008/', 'rscRemote');
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('root-endpoint-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:root-endpoint-action',
        }),
      }),
    );
  });

  it('re-registers callback when alias changes and uses new alias prefix', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'rscRemoteAlt',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(2);

    const callback = mockSetServerCallback.mock.calls[1]?.[0] as
      | ServerCallback
      | undefined;
    expect(typeof callback).toBe('function');
    await (callback as ServerCallback)('alias-change-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemoteAlt:alias-change-action',
        }),
      }),
    );
  });

  it('re-registers callback when normalized action URL changes', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'rscRemote',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/another-action-endpoint?cache=1#hash',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(2);

    const callback = mockSetServerCallback.mock.calls[1]?.[0] as
      | ServerCallback
      | undefined;
    expect(typeof callback).toBe('function');
    await (callback as ServerCallback)('path-change-action', []);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/another-action-endpoint',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:path-change-action',
        }),
      }),
    );
  });

  it('trims alias before callback keying and action prefixing', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      '  rscRemote  ',
    );
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'rscRemote',
    );
    expect(mockSetServerCallback).toHaveBeenCalledTimes(1);

    const callback = getRegisteredCallback();
    await callback('trimmed-alias-action', []);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:rscRemote:trimmed-alias-action',
        }),
      }),
    );
  });

  it('accepts token aliases with dot, underscore, and dash characters', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback(
      'http://127.0.0.1:3008/server-component-root',
      'remote.alias_v2-test',
    );

    const callback = getRegisteredCallback();
    await callback('token-alias-action', []);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3008/server-component-root',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-rsc-action': 'remote:remote.alias_v2-test:token-alias-action',
        }),
      }),
    );
  });

  it('ignores empty callback origins after trimming', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();
    registerRemoteServerCallback('   ');
    expect(mockSetServerCallback).not.toHaveBeenCalled();
  });

  it('rejects invalid aliases and callback URLs', async () => {
    const { registerRemoteServerCallback } = await importRegisterHelper();

    expect(() =>
      registerRemoteServerCallback(
        'http://127.0.0.1:3008/server-component-root',
        '   ',
      ),
    ).toThrow('Remote alias must be a non-empty token');
    expect(() =>
      registerRemoteServerCallback(
        'http://127.0.0.1:3008/server-component-root',
        'bad alias',
      ),
    ).toThrow('Remote alias must be a non-empty token');
    expect(() =>
      registerRemoteServerCallback(
        'http://127.0.0.1:3008/server-component-root',
        'bad:alias',
      ),
    ).toThrow('Remote alias must be a non-empty token');
    expect(() =>
      registerRemoteServerCallback(
        'http://127.0.0.1:3008/server-component-root',
        'bad/alias',
      ),
    ).toThrow('Remote alias must be a non-empty token');
    expect(() =>
      registerRemoteServerCallback('javascript:alert(1)', 'rscRemote'),
    ).toThrow('Remote action callback URL must use http or https');
    expect(() =>
      registerRemoteServerCallback('not-a-url', 'rscRemote'),
    ).toThrow('Remote action callback URL must be an absolute http(s) URL');
    expect(() =>
      registerRemoteServerCallback('/server-component-root', 'rscRemote'),
    ).toThrow('Remote action callback URL must be an absolute http(s) URL');
    expect(() =>
      registerRemoteServerCallback(
        'ftp://127.0.0.1:3008/server-component-root',
        'rscRemote',
      ),
    ).toThrow('Remote action callback URL must use http or https');
    expect(() =>
      registerRemoteServerCallback(
        'http://user:secret@127.0.0.1:3008/server-component-root',
        'rscRemote',
      ),
    ).toThrow(
      'Remote action callback URL must not include embedded credentials',
    );
  });
});
