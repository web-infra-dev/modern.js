import { createElement, type ComponentType } from 'react';

// Emulate a broken remote release inside the remote build, not in the host.
export function withRenderFailure<P extends object>(
  Component: ComponentType<P>,
) {
  return function RemoteRelease(props: P & { labFailure?: string }) {
    if (
      props.labFailure === 'render' ||
      (props.labFailure === 'server' && typeof window === 'undefined')
    ) {
      throw new Error(`LAB_REMOTE_RENDER: ${props.labFailure}`);
    }
    return createElement(Component, props);
  };
}
