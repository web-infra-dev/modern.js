import type { App } from '@modern-js/mcp-apps/react';
import { useEffect, useState } from 'react';

export default function Greeting({
  name = 'Modern.js',
  message,
  mcpApp,
}: {
  name?: string;
  message?: string;
  mcpApp?: App;
}) {
  const [value, setValue] = useState(name);
  const [updated, setUpdated] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(name);
    setUpdated(undefined);
    setError(undefined);
  }, [name, message]);

  return (
    <section style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>{updated ?? message ?? 'Hello!'}</h1>
      <form
        onSubmit={async event => {
          event.preventDefault();
          if (!mcpApp || pending || !value.trim()) return;
          setPending(true);
          setError(undefined);
          try {
            const result = await mcpApp.callServerTool({
              name: 'greet',
              arguments: { name: value.trim() },
            });
            const output = result.structuredContent;
            if (
              result.isError ||
              !output ||
              typeof output !== 'object' ||
              !('message' in output) ||
              typeof output.message !== 'string'
            ) {
              setError('Unable to greet. Try again.');
              return;
            }
            setUpdated(output.message);
          } catch {
            setError('Unable to greet. Try again.');
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          Name{' '}
          <input
            value={value}
            onChange={event => setValue(event.target.value)}
            disabled={pending}
            required
          />
        </label>{' '}
        <button disabled={!mcpApp || pending || !value.trim()} type="submit">
          {pending ? 'Greeting…' : 'Greet again'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
