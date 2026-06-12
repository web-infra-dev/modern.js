import type { ComponentType } from 'react';

export default async function bootstrapFixture(
  _App: ComponentType,
  bootstrap: () => void,
) {
  await Promise.resolve();
  bootstrap();
}
