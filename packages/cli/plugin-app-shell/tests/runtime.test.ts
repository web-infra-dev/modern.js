import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { toRuntimeConfig } from '../src/config';
import { SHELL_ELEMENT_ID } from '../src/inject';
import { createGateScript, RUNTIME_SCRIPT } from '../src/runtime';
import type { AppShellEntryOptions } from '../src/types';

type ShellState = {
  active: boolean;
  removed?: string;
  replayed?: number;
};

const shellState = (): ShellState =>
  (window as unknown as { __MODERN_APP_SHELL__: ShellState })
    .__MODERN_APP_SHELL__;

const nextFrames = (count = 3): Promise<void> =>
  new Promise(resolve => {
    let left = count;
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

const boot = (options: Partial<AppShellEntryOptions>, pathname = '/chat') => {
  window.history.replaceState(null, '', pathname);
  const config = toRuntimeConfig(
    { component: './shell.tsx', readyHold: 0, ...options },
    'root',
  );
  document.body.innerHTML =
    `<div id="root"></div><div id="${SHELL_ELEMENT_ID}">` +
    '<textarea data-app-shell-input></textarea></div>';
  // runs the inline script under test, as the page would
  window.eval(createGateScript(config));
  // runs the inline script under test, as the page would
  window.eval(RUNTIME_SCRIPT);
};

const shellInput = (): HTMLTextAreaElement =>
  document.querySelector('[data-app-shell-input]') as HTMLTextAreaElement;

describe('app shell runtime', () => {
  const originalRect = Element.prototype.getBoundingClientRect;
  beforeEach(() => {
    // happy-dom has no layout; treat every element without `hidden` as visible
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const size = this.hasAttribute('hidden') ? 0 : 10;
      return {
        width: size,
        height: size,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: size,
        bottom: size,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
    document.documentElement.removeAttribute('data-app-shell');
    document.documentElement.removeAttribute('data-app-shell-off');
  });

  it('gate marks a matching pathname as active, ignoring a trailing slash', () => {
    boot({ routes: ['/chat'] }, '/chat/');
    expect(shellState().active).toBe(true);
    expect(document.documentElement.hasAttribute('data-app-shell')).toBe(true);
    expect(document.getElementById(SHELL_ELEMENT_ID)).not.toBeNull();
  });

  it('removes the shell right away on a pathname outside routes', () => {
    boot({ routes: ['/chat', /^\/chat\/main$/] }, '/chat/123');
    expect(shellState().active).toBe(false);
    expect(document.getElementById(SHELL_ELEMENT_ID)).toBeNull();
    expect(document.documentElement.hasAttribute('data-app-shell-off')).toBe(
      false,
    );
  });

  it('keeps the shell until the ready selector renders inside the mount node', async () => {
    boot({ readySelector: 'textarea.real' });
    document.getElementById('root')!.innerHTML = '<div class="loading"></div>';
    await nextFrames();
    expect(document.getElementById(SHELL_ELEMENT_ID)).not.toBeNull();

    document.getElementById('root')!.innerHTML =
      '<textarea class="real"></textarea>';
    await nextFrames();
    expect(document.getElementById(SHELL_ELEMENT_ID)).toBeNull();
    expect(shellState().removed).toBe('ready');
    expect(document.documentElement.hasAttribute('data-app-shell')).toBe(false);
  });

  it('replays early input into the real input and moves focus there', async () => {
    boot({ readySelector: 'textarea.real' });
    const early = shellInput();
    early.focus();
    early.value = 'hello';
    const events: string[] = [];
    const root = document.getElementById('root')!;
    root.innerHTML = '<textarea class="real">a </textarea>';
    const real = root.querySelector('textarea') as HTMLTextAreaElement;
    real.addEventListener('input', () => events.push(real.value));
    await nextFrames();
    expect(real.value).toBe('a hello');
    expect(events).toEqual(['a hello']);
    expect(document.activeElement).toBe(real);
    expect(shellState().replayed).toBe(5);
  });

  it('waits for the IME composition to end before replaying', async () => {
    boot({ readySelector: 'textarea.real' });
    const early = shellInput();
    early.value = 'ni';
    early.dispatchEvent(new Event('compositionstart'));
    document.getElementById('root')!.innerHTML =
      '<textarea class="real"></textarea>';
    await nextFrames();
    expect(document.getElementById(SHELL_ELEMENT_ID)).not.toBeNull();

    early.value = '你';
    early.dispatchEvent(new Event('compositionend'));
    await nextFrames();
    expect(
      (document.querySelector('textarea.real') as HTMLTextAreaElement).value,
    ).toBe('你');
  });

  it('removes the shell after the timeout even when the app never becomes ready', async () => {
    boot({ readySelector: 'textarea.real', timeout: 30 });
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(document.getElementById(SHELL_ELEMENT_ID)).toBeNull();
    expect(shellState().removed).toBe('timeout');
  });
});

describe('app shell runtime settle window', () => {
  const originalRect = Element.prototype.getBoundingClientRect;
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const size = this.hasAttribute('hidden') ? 0 : 10;
      return {
        width: size,
        height: size,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: size,
        bottom: size,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
  });

  it('re-applies replayed text when the app replaces its input right after the first render', async () => {
    boot({ readySelector: 'textarea.real' });
    shellInput().value = 'hello';
    const root = document.getElementById('root')!;
    root.innerHTML = '<textarea class="real"></textarea>';
    await nextFrames();
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'hello',
    );

    root.innerHTML = '<textarea class="real"></textarea>';
    await new Promise(resolve => setTimeout(resolve, 250));
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'hello',
    );
    expect(
      (shellState() as ShellState & { reapplied?: number }).reapplied,
    ).toBe(1);
  });

  it('stops re-applying once the user presses a key', async () => {
    boot({ readySelector: 'textarea.real' });
    shellInput().value = 'hello';
    const root = document.getElementById('root')!;
    root.innerHTML = '<textarea class="real"></textarea>';
    await nextFrames();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    root.innerHTML = '<textarea class="real"></textarea>';
    await new Promise(resolve => setTimeout(resolve, 250));
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      '',
    );
  });
});

describe('app shell runtime ready hold', () => {
  const originalRect = Element.prototype.getBoundingClientRect;
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const size = this.hasAttribute('hidden') ? 0 : 10;
      return {
        width: size,
        height: size,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: size,
        bottom: size,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
  });

  it('keeps the shell for readyHold ms so a reset right after mounting does not drop the replay', async () => {
    boot({
      readySelector: 'textarea.real',
      readyHold: 100,
      input: { settle: 0 },
    });
    shellInput().value = 'hello';
    const root = document.getElementById('root')!;
    root.innerHTML = '<textarea class="real">draft</textarea>';
    await nextFrames();
    // the app resets its input while the shell is still on top
    (root.querySelector('textarea') as HTMLTextAreaElement).value = '';
    expect(document.getElementById(SHELL_ELEMENT_ID)).not.toBeNull();

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(document.getElementById(SHELL_ELEMENT_ID)).toBeNull();
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'hello',
    );
  });
});
