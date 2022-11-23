import { createRoot } from 'react-dom/client';
import { App } from './App';

export function renderInBrowser() {
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
}

renderInBrowser();
