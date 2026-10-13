import type { App } from '@modern-js/mcp-apps/react';
import { useState } from 'react';

export default function Greeting({
  message,
  mcpApp,
}: { message?: string; mcpApp?: App }) {
  const [name, setName] = useState('Modern.js');
  const [updated, setUpdated] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  return (
    <section style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Send a greeting</h1>
      <p>Enter a name and get a greeting from the server.</p>
      <div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Name{' '}
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            required
            disabled={pending}
          />
        </label>
        <button
          disabled={!mcpApp || pending || !name.trim()}
          type="button"
          onClick={async event => {
            event.preventDefault();
            if (!mcpApp || pending || !name.trim()) return;
            setPending(true);
            setError('');
            try {
              const result = await mcpApp.callServerTool({
                name: 'greet',
                arguments: { name: name.trim() },
              });
              const output = result.structuredContent;
              if (
                result.isError ||
                !output ||
                typeof output !== 'object' ||
                !('message' in output) ||
                typeof output.message !== 'string'
              ) {
                throw new Error('Invalid greeting response');
              }
              setUpdated(output.message);
              setCount(value => value + 1);
            } catch {
              setError(
                'Unable to greet. Your name is saved — please try again.',
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? 'Sending…' : 'Send greeting'}
        </button>
      </div>
      {!mcpApp && <p>Connect to an MCP host to send a greeting.</p>}
      {error && <p role="alert">{error}</p>}
      <output
        aria-live="polite"
        aria-busy={pending}
        style={{ display: 'block', marginTop: 16 }}
      >
        <span style={{ display: 'block', fontSize: 28 }}>
          {updated ?? message ?? 'Your greeting will appear here.'}
        </span>
        {count > 0 && (
          <span style={{ display: 'block' }}>
            Successful greetings: {count}
          </span>
        )}
      </output>
    </section>
  );
}
