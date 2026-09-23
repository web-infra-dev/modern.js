import type { App } from '@modern-js/mcp-apps/react';
import { useState } from 'react';

export default function Greeting({
  message,
  mcpApp,
}: { message?: string; mcpApp?: App }) {
  const [updated, setUpdated] = useState<string>();
  const [pending, setPending] = useState(false);
  return (
    <section style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>{updated ?? message ?? 'Hello!'}</h1>
      <button
        disabled={!mcpApp || pending}
        type="button"
        onClick={async () => {
          if (!mcpApp) return;
          setPending(true);
          try {
            const result = await mcpApp.callServerTool({
              name: 'greet',
              arguments: { name: 'Modern.js' },
            });
            setUpdated(
              result.isError
                ? 'Unable to greet. Try again.'
                : String(result.structuredContent?.message ?? ''),
            );
          } catch {
            setUpdated('Unable to greet. Try again.');
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? 'Greeting…' : 'Greet again'}
      </button>
    </section>
  );
}
