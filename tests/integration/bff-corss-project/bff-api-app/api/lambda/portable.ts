import type { ApiMessage } from '@shared/types';

// The return type is imported through the `@shared/*` tsconfig alias, so its
// declaration references the alias. Consumers of the published client can only
// resolve it once the alias is rewritten to a relative path (afterDeclarations)
// and the shared declaration ships (files: `**/*.d.ts`).
export default async (): Promise<ApiMessage> => ({
  message: 'Hello portable bff-api-app',
  from: 'bff-api-app',
});
