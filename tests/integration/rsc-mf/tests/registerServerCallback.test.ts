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
      registerRemoteServerCallback('javascript:alert(1)', 'rscRemote'),
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
