import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';
import { bootstrap } from '../../src/core/compatible';

describe('bootstrap', () => {
  it('Only return App Comoonent by `createApp`', async () => {
    function App() {
      return <div>App</div>;
    }

    const result = await bootstrap(App, undefined as any, undefined, ReactDOM);
    expect(React.isValidElement(result as any)).toBe(true);
  });

  it('bootstrap with root id', async () => {
    const root = document.createElement('div');
    function App() {
      return <div>App</div>;
    }
    await bootstrap(App, root, undefined, {
      createRoot: rootDOM => {
        const root = ReactDOM.createRoot(rootDOM);
        return {
          render: (App: any) => {
            flushSync(() => {
              root.render(App);
            });
          },
          unmount: root.unmount,
        };
      },
    });
    expect(root.innerHTML).toEqual('<div>App</div>');
  });

  it('bootstrap with error root id', async () => {
    function App() {
      return <div>App</div>;
    }
    expect(async () => {
      await bootstrap(App, {} as any, undefined, ReactDOM);
    }).rejects.toThrowError(
      '`bootstrap` needs id in browser environment, it needs to be string or element',
    );
  });
});
