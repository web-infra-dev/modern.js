import { createElement, forwardRef, memo } from 'react';
import {
  mountRemoteComponent,
  resolveRemoteExport,
} from '../src/mf-runtime/remote';

describe('MF remote exports', () => {
  it('rejects missing named exports instead of falling back to default', () => {
    expect(() =>
      resolveRemoteExport({ default: () => null }, 'Missing'),
    ).toThrow('missing or invalid');
    expect(() => resolveRemoteExport({}, 'default')).toThrow(
      'missing or invalid',
    );
    expect(() =>
      resolveRemoteExport({ default: createElement('div') }, 'default'),
    ).toThrow();
  });

  it('accepts wrapped React components and validates mount exports separately', () => {
    const wrapped = memo(() => null);
    const forwarded = forwardRef(() => null);
    expect(resolveRemoteExport({ default: wrapped }, 'default')).toBe(wrapped);
    expect(resolveRemoteExport(forwarded, 'default')).toBe(forwarded);
    const mount = { mount() {} };
    expect(resolveRemoteExport({ default: mount }, 'default', 'mount')).toBe(
      mount,
    );
    expect(() => resolveRemoteExport({ default: mount }, 'default')).toThrow();
  });

  it('preserves receivers for mount, instance update and unmount', () => {
    const calls: unknown[] = [];
    const instance = {
      update(props: unknown) {
        calls.push(this, props);
      },
      unmount() {
        calls.push(this);
      },
    };
    const remote = {
      mount(_container: HTMLElement, props: unknown) {
        calls.push(this, props);
        return instance;
      },
    };
    const mounted = mountRemoteComponent(
      resolveRemoteExport(remote, 'default', 'mount'),
      {} as HTMLElement,
      { value: 1 },
    );
    mounted.update({ value: 2 });
    mounted.unmount();
    expect(calls).toEqual([
      remote,
      { value: 1 },
      instance,
      { value: 2 },
      instance,
    ]);
  });

  it('preserves the receiver for module-level update and invokes cleanup callbacks', () => {
    const cleanup = rs.fn();
    const remote = Object.assign(() => cleanup, {
      update: rs.fn(function (this: unknown) {
        expect(this).toBe(remote);
      }),
    });
    const mounted = mountRemoteComponent(
      resolveRemoteExport(remote, 'default', 'mount'),
      {} as HTMLElement,
      {},
    );
    mounted.update({ value: 1 });
    mounted.unmount();
    expect(remote.update).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
