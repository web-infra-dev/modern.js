import { renderToString } from 'react-dom/server';
import ReactHelmet, { type HelmetProps } from 'react-helmet';
import { setRequestHelmetCollector } from '../../src/core/head/requestCollector';
import { buildShellBeforeTemplate } from '../../src/core/server/stream/beforeTemplate';
import { Helmet } from '../../src/exports/head';

const template = '<html><head><title>default</title></head><body>';
const options = {
  runtimeContext: {} as any,
  config: {} as any,
  entryName: 'main',
};

describe('request scoped Helmet', () => {
  let current: HelmetProps[] | undefined;

  beforeAll(() => {
    ReactHelmet.canUseDOM = false;
    setRequestHelmetCollector(() => current);
  });

  afterEach(() => {
    current = undefined;
    ReactHelmet.renderStatic();
  });

  test('renders react-helmet when no request is collecting', () => {
    renderToString(
      <Helmet>
        <title>plain</title>
      </Helmet>,
    );
    expect(ReactHelmet.renderStatic().title.toString()).toContain('plain');
  });

  test('keeps the head of interleaved requests apart', async () => {
    const requestA: HelmetProps[] = [];
    const requestB: HelmetProps[] = [];

    current = requestA;
    renderToString(
      <Helmet>
        <title>request a</title>
        <meta name="owner" content="a" />
      </Helmet>,
    );
    current = requestB;
    renderToString(
      <Helmet>
        <title>request b</title>
      </Helmet>,
    );

    const headA = await buildShellBeforeTemplate(template, {
      ...options,
      helmetProps: requestA,
    });
    const headB = await buildShellBeforeTemplate(template, {
      ...options,
      helmetProps: requestB,
    });

    expect(headA).toContain('request a');
    expect(headA).toContain('content="a"');
    expect(headB).toContain('request b');
    expect(headB).not.toContain('content="a"');
  });

  test('does not leak a Helmet mounted after the shell into the next request', async () => {
    const requestA: HelmetProps[] = [];
    current = requestA;
    await buildShellBeforeTemplate(template, {
      ...options,
      helmetProps: requestA,
    });
    // Rendered by a Suspense boundary that resolved after the shell.
    renderToString(
      <Helmet>
        <title>late a</title>
      </Helmet>,
    );

    const requestB: HelmetProps[] = [];
    current = requestB;
    const headB = await buildShellBeforeTemplate(template, {
      ...options,
      helmetProps: requestB,
    });
    expect(headB).not.toContain('late a');
    expect(headB).toContain('<title>default</title>');
  });
});
