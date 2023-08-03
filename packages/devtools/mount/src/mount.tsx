import { createRoot } from 'react-dom/client';
import App, { AppProps } from './App';

export const mountDevTools = (options: Partial<AppProps>) => {
  const props: AppProps = {
    client: 'https://modernjs.dev/devtools',
    dataSource: '/_modern_js/devtools/rpc',
    version: `~${process.env.VERSION}`,
    ...options,
  };

  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'closed' });
  const root = createRoot(shadow);

  document.body.appendChild(container);

  root.render(<App {...props} />);
};
