import { createRoot } from '@modern-js/runtime-v2/react';
import { render } from '@modern-js/runtime-v2/client';
import App from './App';

async function main() {
  const EdenXRoot = await createRoot(App);

  render(<EdenXRoot />);
}
main();
