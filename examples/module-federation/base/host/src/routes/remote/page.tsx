/**
 * When you declare the remote component in module-federation.config.ts
 * You can also directly import the component from the remote package
 * But it will flash the page when use SSR and the provider has css
 * For detail, please see https://module-federation.io/practice/frameworks/modern/index.html#css-flickering-issue
 */
import { createLazyComponent } from '@module-federation/modern-js-v3/react';
import { getInstance } from '@module-federation/modern-js-v3/runtime';
import type React from 'react';

const Button = createLazyComponent({
  instance: getInstance(),
  loader: () => import('remote/Button'),
  loading: 'loading...',
  export: 'Button',
  fallback: ({ error }) => {
    return (
      <div>
        <div>Fallback</div>
        <div>{error instanceof Error ? error.message : String(error)}</div>
      </div>
    );
  },
});

const Index = (): React.JSX.Element => {
  return (
    <div>
      <Button />
    </div>
  );
};

export default Index;
