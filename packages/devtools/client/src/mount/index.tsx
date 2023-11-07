import { createRoot } from 'react-dom/client';
import DevtoolsAction from './components/Devtools/Action';

// @ts-expect-error
const { container, options } = window._modern_js_devtools_app;
const root = createRoot(container);
root.render(<DevtoolsAction {...options} />);
