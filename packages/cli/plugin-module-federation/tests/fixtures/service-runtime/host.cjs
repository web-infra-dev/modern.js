const assert = require('node:assert/strict');
const input = JSON.parse(process.argv[2]);
const { renderToStaticMarkup } = require(input.renderer);
const { createJiti } = require(input.jiti);
const jiti = createJiti(__filename, { fsCache: false });

(async () => {
  const { registerServiceConfig } = await jiti.import(input.config);
  const { default: serviceRuntimePlugin } = await jiti.import(input.plugin);
  const { ModuleFederation } = require(input.runtime);
  registerServiceConfig('host-a', {
    'weather/Service': {
      timeoutMs: 250,
      forwardHeaders: ['x-user'],
      serviceHeaders: { authorization: 'private-host-a-service-token' },
    },
  });
  // Observe real registry reads, retaining the actual Map and its lookup behavior.
  const registry =
    globalThis[Symbol.for('@modern-js/module-federation/private-services')];
  const reads = [];
  const get = registry.get;
  registry.get = function (name) {
    reads.push(name);
    return get.call(this, name);
  };
  const runtime = new ModuleFederation({
    name: 'host-a',
    inBrowser: false,
    shareStrategy: 'loaded-first',
    remotes: [{ name: 'weather', alias: 'forecast', entry: input.weather }],
    plugins: [serviceRuntimePlugin({ name: 'host-a' })],
  });
  const card = await runtime.loadRemote('forecast/Card');
  assert.equal(
    renderToStaticMarkup(await card.render()),
    '<section>weather:<p>ordinary downstream SSR</p></section>',
  );
  assert.deepEqual(
    reads,
    [],
    'ordinary container initialization/loading must not read private Service configuration',
  );
  assert.deepEqual(
    [...registry.keys()],
    ['host-a'],
    'weather context must remain unregistered',
  );

  registerServiceConfig('registered-empty', {});
  const defaultRuntime = new ModuleFederation({
    name: 'registered-empty',
    inBrowser: false,
    shareStrategy: 'loaded-first',
    remotes: [{ name: 'weather', entry: input.weather }],
    plugins: [serviceRuntimePlugin({ name: 'registered-empty' })],
  });
  const defaultService = await defaultRuntime.loadRemote('weather/Service');
  assert.equal(typeof defaultService.default().renderStream, 'function');
  assert.deepEqual(reads, ['registered-empty']);

  // The imported weather container owns this nested Service consumption. Its
  // missing context must fail here, without borrowing host-a's credentials.
  await assert.rejects(
    card.loadService(),
    /Service runtime 'weather'.*no server configuration/,
  );
  assert.deepEqual(reads, ['registered-empty', 'weather']);
  assert.equal(
    renderToStaticMarkup(await card.render()),
    '<section>weather:<p>ordinary downstream SSR</p></section>',
  );

  const remote = await runtime.loadRemote('forecast/Service');
  const provider = remote.default();
  const render = async props => {
    const result = await provider.renderStream({
      instanceId: 'service-instance',
      moduleName: 'weather/Service',
      identifierPrefix: 'service-',
      url: 'https://host.example/weather',
      basename: '/weather',
      headers: {
        'x-user': 'alice',
        cookie: 'host-private-cookie',
        authorization: 'browser-token',
      },
      props,
      signal: new AbortController().signal,
    });
    const reader = result.messages.getReader();
    const messages = [];
    try {
      for (;;) {
        const value = await reader.read();
        if (value.done) break;
        messages.push(value.value);
      }
    } finally {
      reader.releaseLock();
    }
    return messages;
  };
  const messages = await render({ station: 'Hangzhou' });
  assert.ok(
    messages.some(
      message =>
        message.type === 'html' &&
        message.html === '<p>HTTP weather:Hangzhou</p>',
    ),
  );
  assert.equal(messages.at(-1).type, 'done');
  await assert.rejects(render({ slow: true }), /timed out/);
  assert.deepEqual(reads, ['registered-empty', 'weather', 'host-a']);
  assert.equal(
    renderToStaticMarkup(await card.render()),
    '<section>weather:<p>ordinary downstream SSR</p></section>',
  );
  console.log(
    'Verified ordinary A -> weather -> B, scoped Service policy, HTTP rendering and timeout',
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
