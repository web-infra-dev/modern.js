import { Readable } from 'stream';
import { DeferredData } from '@modern-js/runtime-utils/browser';
import { storage } from '@modern-js/runtime-utils/node';
import { createElement } from 'react';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../src/common';
import {
  getGlobalInternalRuntimeContext,
  setGlobalInternalRuntimeContext,
} from '../../src/core/context';
import { createReadableStreamFromElement } from '../../src/core/server/stream/createReadableStream';
import {
  enqueueFromEntries,
  hasDeferredResolvers,
} from '../../src/core/server/stream/deferredScript';
import { DeferredScriptOutputCoordinator } from '../../src/core/server/stream/deferredScriptOutputCoordinator';

const resolver = (name: string) => `<script data-resolver="${name}"></script>`;

function createCoordinator() {
  const output: string[] = [];
  const coordinator = new DeferredScriptOutputCoordinator(chunk => {
    output.push(chunk);
  });

  return {
    coordinator,
    chunks: output,
    output: () => output.join(''),
  };
}

// Inline scripts and styles with near-miss end tags, comments, quoted `>` in
// attributes, a React continuation segment and multi-byte text.
const REPRESENTATIVE_HTML = [
  '<div class="card a>b" data-x=\'1\' hidden=hidden><!-- <b> -->',
  '<style>.a::before{content:"</style"}</style>',
  '<script>const s = "</scr" + "ipt>"; if (a <b && c <</script) {}</SCRIPT >',
  '<div hidden id="modern-js-S:0"><span>中文 🚀</span></div>',
  '<script>$RC("modern-js-B:0","modern-js-S:0")</script>',
  '<textarea><p></textarea><br/><img src=x alt=y></div>',
].join('');

function chunkString(value: string, size: number) {
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += size) {
    chunks.push(value.slice(offset, offset + size));
  }
  return chunks;
}

describe('DeferredScriptOutputCoordinator', () => {
  test('keeps resolvers before the shell in the pre-shell queue', () => {
    const { coordinator, output } = createCoordinator();

    coordinator.enqueueResolver(resolver('before-shell'));
    coordinator.writeReact('<html><body>shell</body></html>');

    expect(output()).toBe('<html><body>shell</body></html>');

    coordinator.markShellFinished();

    expect(output()).toBe(
      '<html><body>shell</body></html><script data-resolver="before-shell"></script>',
    );
  });

  test('observes marker-chunk afterMark bytes before releasing pre-shell resolvers', () => {
    const { coordinator, output } = createCoordinator();

    coordinator.enqueueResolver(resolver('before-shell'));
    coordinator.writeReact('<html><body>shell</body></html><a href="/template');
    coordinator.markShellFinished();

    expect(output()).toBe('<html><body>shell</body></html><a href="/template');

    coordinator.writeReact('">template</a>');

    expect(output()).toBe(
      '<html><body>shell</body></html><a href="/template">template</a><script data-resolver="before-shell"></script>',
    );
  });

  test('waits for a quoted attribute to close and preserves UTF-8 text', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact('<a href="https://example.test/你好');
    coordinator.enqueueResolver(resolver('first'));
    coordinator.enqueueResolver(resolver('second'));

    expect(output()).toBe('<a href="https://example.test/你好');

    coordinator.writeReact('">链接</a>');

    expect(output()).toBe(
      '<a href="https://example.test/你好">链接</a><script data-resolver="first"></script><script data-resolver="second"></script>',
    );
  });

  test('waits for any incomplete attribute before preserving FIFO resolver order', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact('<div class="skeleton');
    coordinator.enqueueResolver(resolver('class'));
    coordinator.writeReact('">content</div>');

    expect(output()).toBe(
      '<div class="skeleton">content</div><script data-resolver="class"></script>',
    );
  });

  test('keeps the response open until registered resolver promises are emitted', async () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    let resolveData: (value: string) => void;
    const data = new Promise<string>(resolve => {
      resolveData = resolve;
    });
    const completed = enqueueFromEntries(
      [
        [
          'route',
          {
            data: { templateData: data },
            pendingKeys: ['templateData'],
          },
        ],
      ],
      new Map([['route', ['templateData']]]),
      undefined,
      script => coordinator.enqueueResolver(script),
    );

    coordinator.writeReact('<a href="/template');
    resolveData!('resolved');
    await completed;

    expect(output()).toBe('<a href="/template');

    coordinator.writeReact('">template</a>');
    coordinator.finish();

    expect(output()).toMatch(
      /^<a href="\/template">template<\/a><script async data-fn-name="r"/,
    );
    expect(output()).toContain('&quot;resolved&quot;');
  });

  test('emits a resolver for an initially pending key after it leaves pendingKeys', async () => {
    let resolveTemplate: (value: string) => void;
    const template = new Promise<string>(resolve => {
      resolveTemplate = resolve;
    });
    const deferred = new DeferredData({
      templateData: template,
      preResolved: Promise.resolve('already ready'),
    });
    await deferred.data.preResolved;

    const serializedKeys = new Map([['route', deferred.pendingKeys]]);
    resolveTemplate!('template ready');
    await deferred.data.templateData;
    expect(deferred.pendingKeys).toEqual([]);

    const scripts: string[] = [];
    await enqueueFromEntries(
      [['route', deferred]],
      serializedKeys,
      undefined,
      script => scripts.push(script),
    );

    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toContain('templateData');
    expect(scripts[0]).toContain('template ready');
    expect(scripts[0]).not.toContain('preResolved');
  });

  test('does not inject into comments, templates, or raw-text elements', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact('<!-- deferred');
    coordinator.enqueueResolver(resolver('comment'));
    coordinator.writeReact(' -->');
    coordinator.writeReact('<template><span>template</span>');
    coordinator.enqueueResolver(resolver('template'));
    coordinator.writeReact('</template>');
    coordinator.writeReact(
      '<style>.card::before { content: "<script>"; }</style>',
    );
    coordinator.enqueueResolver(resolver('style'));
    coordinator.writeReact(
      '<script>const html = "<a href=\\"/x\\">";</script>',
    );
    coordinator.enqueueResolver(resolver('script'));
    coordinator.writeReact('<div>next</div>');

    expect(output()).toBe(
      '<!-- deferred --><script data-resolver="comment"></script><template><span>template</span></template><script data-resolver="template"></script><style>.card::before { content: "<script>"; }</style><script data-resolver="style"></script><script>const html = "<a href=\\"/x\\">";</script><script data-resolver="script"></script><div>next</div>',
    );
  });

  test('waits for React continuation protocol script before injecting', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact(
      '<div hidden id="modern-js-S:0"><a href="/template">template</a></div>',
    );
    coordinator.enqueueResolver(resolver('continuation'));

    expect(output()).toBe(
      '<div hidden id="modern-js-S:0"><a href="/template">template</a></div>',
    );

    coordinator.writeReact('<script>window.afterContinuation = true</script>');

    expect(output()).toBe(
      '<div hidden id="modern-js-S:0"><a href="/template">template</a></div><script>window.afterContinuation = true</script>',
    );

    coordinator.writeReact('<script>$RC("B:0", "modern-js-S:0")</script>');

    expect(output()).toBe(
      '<div hidden id="modern-js-S:0"><a href="/template">template</a></div><script>window.afterContinuation = true</script><script>$RC("B:0", "modern-js-S:0")</script><script data-resolver="continuation"></script>',
    );
  });

  test('releases resolvers after a styled boundary uses the shorter $RR instruction', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    const segment = '<div hidden id="modern-js-S:1"><div>styled</div></div>';
    const instruction =
      '<script>$RR("modern-js-B:1","modern-js-S:1",[["/style.css","default"]])</script>';

    coordinator.writeReact(segment);
    coordinator.writeReact(instruction);
    coordinator.enqueueResolver(resolver('styled'));
    coordinator.finish();

    expect(output()).toBe(`${segment}${instruction}${resolver('styled')}`);
  });

  test.each([
    [
      'SVG',
      '<svg aria-hidden="true" style="display:none" id="modern-js-S:1"><circle /></svg>',
    ],
    [
      'MathML',
      '<math aria-hidden="true" style="display:none" id="modern-js-S:2"><mi>x</mi></math>',
    ],
    [
      'table',
      '<table hidden id="modern-js-S:3"><tbody><tr><td>x</td></tr></tbody></table>',
    ],
    [
      'table body',
      '<table hidden><tbody id="modern-js-S:4"><tr><td>x</td></tr></tbody></table>',
    ],
    [
      'table row',
      '<table hidden><tr id="modern-js-S:5"><td>x</td></tr></table>',
    ],
    [
      'colgroup',
      '<table hidden><colgroup id="modern-js-S:6"><col /></colgroup></table>',
    ],
  ])(
    'waits for the React %s continuation protocol script',
    (_name, segment) => {
      const { coordinator, output } = createCoordinator();
      coordinator.markShellFinished();

      coordinator.writeReact(segment);
      coordinator.enqueueResolver(resolver('continuation'));

      expect(output()).toBe(segment);

      coordinator.writeReact('<script>$RC("B:0", "modern-js-S:0")</script>');

      expect(output()).toBe(
        `${segment}<script>$RC("B:0", "modern-js-S:0")</script><script data-resolver="continuation"></script>`,
      );
    },
  );

  test('does not confuse business IDs with React continuation segments', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact(
      '<div hidden id="modern-js-S:business">content</div>',
    );
    coordinator.enqueueResolver(resolver('business'));
    coordinator.finish();

    expect(output()).toBe(
      '<div hidden id="modern-js-S:business">content</div><script data-resolver="business"></script>',
    );
  });

  test('forwards React chunks as-is without tokenizing when no resolver can be queued', () => {
    const consume = rstest.spyOn(SharedCoordinator.prototype as any, 'consume');
    try {
      for (const size of [1, 7, 64, REPRESENTATIVE_HTML.length]) {
        const chunks = chunkString(REPRESENTATIVE_HTML, size);
        const tracking = createCoordinator();
        const passThrough = createCoordinator();
        passThrough.coordinator.markNoResolvers();

        for (const { coordinator } of [tracking, passThrough]) {
          coordinator.markShellFinished();
          for (const chunk of chunks) {
            coordinator.writeReact(chunk);
          }
          coordinator.finish();
        }

        expect(passThrough.chunks).toEqual(chunks);
        expect(passThrough.chunks).toEqual(tracking.chunks);
      }

      consume.mockClear();
      const { coordinator } = createCoordinator();
      coordinator.markNoResolvers();
      coordinator.writeReact(REPRESENTATIVE_HTML);
      expect(consume).not.toHaveBeenCalled();

      createCoordinator().coordinator.writeReact(REPRESENTATIVE_HTML);
      expect(consume).toHaveBeenCalledTimes(REPRESENTATIVE_HTML.length);
    } finally {
      consume.mockRestore();
    }
  });

  test('never inserts a resolver at an unknown position without tokenizing', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markNoResolvers();
    coordinator.markShellFinished();

    coordinator.writeReact('<a href="/template');
    coordinator.enqueueResolver(resolver('unexpected'));
    coordinator.writeReact('">template</a>');

    expect(output()).toBe('<a href="/template">template</a>');
    expect(() => coordinator.finish()).toThrow('marked as having no resolvers');

    const aborted = createCoordinator();
    aborted.coordinator.markNoResolvers();
    aborted.coordinator.abort();
    aborted.coordinator.writeReact('<p>after abort</p>');
    expect(aborted.output()).toBe('');
  });

  test('waits for the real raw-text end tag after near misses', () => {
    const { coordinator, output } = createCoordinator();
    coordinator.markShellFinished();

    coordinator.writeReact(
      '<script>a <b; c </scr; d </scripts; e = "<</script"; f <<</',
    );
    coordinator.enqueueResolver(resolver('script'));
    coordinator.writeReact('SCRIPT');
    coordinator.writeReact('><p>next</p>');

    expect(output()).toBe(
      '<script>a <b; c </scr; d </scripts; e = "<</script"; f <<</SCRIPT><script data-resolver="script"></script><p>next</p>',
    );
  });
});

describe('hasDeferredResolvers', () => {
  const settled = () => Promise.resolve('value');

  test.each<
    [
      string,
      Array<[string, unknown]>,
      Map<string, string[]> | undefined,
      boolean,
    ]
  >([
    ['no entries', [], new Map(), false],
    ['non-deferred values', [['route', { foo: 1 }]], new Map(), false],
    [
      'loader data without deferred keys',
      [['route', { data: { a: 1 }, pendingKeys: [] }]],
      new Map([['route', []]]),
      false,
    ],
    [
      'a pending deferred key',
      [['route', { data: { a: settled() }, pendingKeys: ['a'] }]],
      new Map([['route', ['a']]]),
      true,
    ],
    [
      'a deferred key that was not serialized',
      [['route', { data: { a: settled() }, pendingKeys: ['a'] }]],
      new Map(),
      false,
    ],
    [
      'pending keys without serialized keys',
      [['route', { data: { a: settled() }, pendingKeys: ['a'] }]],
      undefined,
      true,
    ],
    [
      'a serialized key that is not a promise',
      [['route', { data: { a: 'ready' }, pendingKeys: ['a'] }]],
      new Map([['route', ['a']]]),
      false,
    ],
    [
      'one deferred route among plain routes',
      [
        ['layout', { data: { a: 1 }, pendingKeys: [] }],
        ['page', { data: { b: settled() }, pendingKeys: ['b'] }],
      ],
      new Map([
        ['layout', []],
        ['page', ['b']],
      ]),
      true,
    ],
  ])(
    'matches whether enqueueFromEntries emits a resolver: %s',
    async (_name, entries, deferredScriptKeys, expected) => {
      const scripts: string[] = [];
      await enqueueFromEntries(entries, deferredScriptKeys, undefined, script =>
        scripts.push(script),
      );

      expect(hasDeferredResolvers(entries, deferredScriptKeys)).toBe(expected);
      expect(scripts.length > 0).toBe(expected);
    },
  );
});

describe('createReadableStreamFromElement deferred resolvers', () => {
  const previousContext = getGlobalInternalRuntimeContext();

  afterAll(() => {
    setGlobalInternalRuntimeContext(previousContext);
  });

  const SHELL_BEFORE = '<html><body><div id="root">';
  const SHELL_AFTER = '</div></body></html>';
  const options = {
    runtimeContext: {
      ssrContext: { request: { pathname: '/', url: 'http://localhost/' } },
    },
    config: {},
    ssrConfig: {},
    htmlTemplate: `${SHELL_BEFORE}<!--<?- html ?>-->${SHELL_AFTER}`,
    entryName: 'main',
    onError: () => {},
  } as any;

  async function renderStream(
    activeDeferreds: Map<string, unknown>,
    deferredScriptKeys: Map<string, string[]>,
  ) {
    // Replace the React output with a fixed document so the test controls it.
    const document = `${REPRESENTATIVE_HTML}${ESCAPED_SHELL_STREAM_END_MARK}<p>after</p>`;
    setGlobalInternalRuntimeContext({
      hooks: {
        extendStreamSSR: {
          call: () => [
            {
              processStream: (reactStream: NodeJS.ReadWriteStream) => {
                reactStream.resume();
                return Readable.from(chunkString(document, 64));
              },
            },
          ],
        },
      },
    } as any);

    const stream = await storage.run(
      { activeDeferreds, deferredScriptKeys },
      () =>
        createReadableStreamFromElement(
          new Request('http://localhost/'),
          createElement('div'),
          options,
        ),
    );
    return new Response(stream).text();
  }

  test.each([
    ['no loader data', new Map(), new Map()],
    [
      'loader data without deferred keys',
      new Map([['route', { data: { a: 1 }, pendingKeys: [] }]]),
      new Map([['route', []]]),
    ],
  ])(
    'does not tokenize the stream with %s',
    async (_name, activeDeferreds, deferredScriptKeys) => {
      const consume = rstest.spyOn(
        SharedCoordinator.prototype as any,
        'consume',
      );
      try {
        expect(await renderStream(activeDeferreds, deferredScriptKeys)).toBe(
          `${SHELL_BEFORE}${REPRESENTATIVE_HTML}${SHELL_AFTER}<p>after</p>`,
        );
        expect(consume).not.toHaveBeenCalled();
      } finally {
        consume.mockRestore();
      }
    },
  );

  test('tokenizes the stream and emits resolvers for pending deferred data', async () => {
    const consume = rstest.spyOn(SharedCoordinator.prototype as any, 'consume');
    try {
      const html = await renderStream(
        new Map([
          [
            'route',
            { data: { a: Promise.resolve('value') }, pendingKeys: ['a'] },
          ],
        ]),
        new Map([['route', ['a']]]),
      );

      expect(
        html.startsWith(
          `${SHELL_BEFORE}${REPRESENTATIVE_HTML}${SHELL_AFTER}<p>after</p><script async data-fn-name="r"`,
        ),
      ).toBe(true);
      expect(consume).toHaveBeenCalled();
    } finally {
      consume.mockRestore();
    }
  });
});
import { DeferredScriptOutputCoordinator as SharedCoordinator } from '@modern-js/render/html/stream';
