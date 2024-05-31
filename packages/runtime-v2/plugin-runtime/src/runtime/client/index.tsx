import ReactDOM from 'react-dom/client';
import { getInitialContext } from '../context/runtime';
import { getGlobalRunner } from '../plugin/runner';

export async function render(App: React.ReactNode, id?: string) {
  const runner = getGlobalRunner();
  await runner.init(
    { context: getInitialContext(runner) },
    {
      onLast: context => ({ context }),
    },
  );
  const rootElement = document.getElementById(id || 'root')!;
  ReactDOM.createRoot(rootElement).render(App);
}
