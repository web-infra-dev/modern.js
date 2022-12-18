import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

// import 'uno.css';

export function renderInBrowser() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

renderInBrowser();
