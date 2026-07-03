import * as React from 'react';

export const bundledReactVersion = React.version;

const errorMessage =
  "Cannot read properties of null (reading 'useSyncExternalStore')";

const reportBundledReact = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('react-multi-version:component-error', {
      detail: {
        packageName: 'react',
        version: bundledReactVersion,
        bundled: true,
        issuer: '@otrade/transaction_adapter',
        sourceFile: 'provider/packages/transaction-adapter/src/index.js',
        message: errorMessage,
      },
    }),
  );
};

export function LegacyZustandWidget() {
  reportBundledReact();

  const checkoutLabel = React.useSyncExternalStore(
    () => () => {},
    () => 'legacy checkout adapter is using bundled React',
    () => 'legacy checkout adapter is using bundled React',
  );

  return React.createElement('p', null, checkoutLabel);
}
