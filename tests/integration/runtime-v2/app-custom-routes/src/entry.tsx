import { createRoot } from '@modern-js/runtime-v2/react';
import { render } from '@modern-js/runtime-v2/client';

async function main() {
  const EdenXRoot = await createRoot();

  render(<EdenXRoot />);
}
main();
