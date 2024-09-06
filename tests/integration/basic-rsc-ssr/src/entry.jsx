import Root from './root';
import { hydrateRoot, createRoot } from 'react-dom/client';

const rootDom = document.getElementById('root');

if (rootDom) {
  hydrateRoot(rootDom, <Root />);

  // const root = createRoot(rootDom);
  // root.render(<Root />);
} else {
  throw new Error('Root element not found');
}
