import { RuntimeReactContext, getInitialContext } from '../context/runtime';
import { getGlobalRunner } from '../plugin/runner';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

export async function render(App: React.ReactNode, id?: string) {
  const runner = getGlobalRunner();
  const context = await runner.init(
    { context: getInitialContext(runner) },
    {
      onLast: ({ context }) => context,
    },
  );
  const rootElement = document.getElementById(id || 'root')!;
  const renderFunc = IS_REACT18 ? renderWithReact18 : renderWithReact17;
  renderFunc(
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
  ReactDOM.createRoot(rootElement).render(App);
}

async function renderWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom');
  ReactDOM.render(App, rootElement);
}
