import { RuntimeReactContext, getInitialContext } from '../context/runtime';
import { getGlobalRunner } from '../plugin/runner';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

export async function render(App: React.ReactNode, id?: HTMLElement | string) {
  const runner = getGlobalRunner();
  const context = await runner.init(
    { context: getInitialContext(runner) },
    {
      onLast: ({ context }) => context,
    },
  );
  const rootElement =
    id && typeof id !== 'string' ? id : document.getElementById(id || 'root')!;
  const renderFunc = IS_REACT18 ? renderWithReact18 : renderWithReact17;
  return renderFunc(
    <RuntimeReactContext.Provider value={context}>
      {App}
    </RuntimeReactContext.Provider>,
    rootElement,
  );
}

async function renderWithReact18(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom/client');
  const root = ReactDOM.createRoot(rootElement);
  root.render(App);
  return root;
}

async function renderWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom');
  ReactDOM.render(App, rootElement);
  return rootElement;
}
