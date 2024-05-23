import ReactDOM from 'react-dom/client';

export function render(App: React.ComponentType, id?: string) {
  const rootElement = document.getElementById(id || 'root')!;
  ReactDOM.createRoot(rootElement).render(<App />);
}
