import { enqueueFromEntries } from '../../src/core/server/stream/deferredScript';
import { DeferredScriptOutputCoordinator } from '../../src/core/server/stream/deferredScriptOutputCoordinator';

const resolver = (name: string) => `<script data-resolver="${name}"></script>`;

function createCoordinator() {
  const output: string[] = [];
  const coordinator = new DeferredScriptOutputCoordinator(chunk => {
    output.push(chunk);
  });

  return {
    coordinator,
    output: () => output.join(''),
  };
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
});
