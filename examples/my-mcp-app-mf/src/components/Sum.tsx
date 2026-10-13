import type { App } from '@modern-js/mcp-apps/react';
import { useState } from 'react';

export default function Sum({
  a,
  b,
  sum,
  mcpApp,
}: { a?: number; b?: number; sum?: number; mcpApp?: App }) {
  const [first, setFirst] = useState(String(a ?? 1));
  const [second, setSecond] = useState(String(b ?? 2));
  const [updated, setUpdated] = useState<{
    a: number;
    b: number;
    sum: number;
  }>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const valid =
    first.trim() !== '' &&
    second.trim() !== '' &&
    Number.isFinite(Number(first)) &&
    Number.isFinite(Number(second));
  const result = updated ?? { a, b, sum };
  return (
    <section style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Add two numbers</h1>
      <p>Change the numbers and ask the server to calculate their sum.</p>
      <form
        onSubmit={async event => {
          event.preventDefault();
          if (!mcpApp || pending || !valid) return;
          setPending(true);
          setError('');
          try {
            const response = await mcpApp.callServerTool({
              name: 'add_numbers',
              arguments: { a: Number(first), b: Number(second) },
            });
            const output = response.structuredContent;
            if (
              response.isError ||
              !output ||
              typeof output !== 'object' ||
              !('a' in output) ||
              !('b' in output) ||
              !('sum' in output) ||
              typeof output.a !== 'number' ||
              typeof output.b !== 'number' ||
              typeof output.sum !== 'number' ||
              !Number.isFinite(output.a) ||
              !Number.isFinite(output.b) ||
              !Number.isFinite(output.sum)
            ) {
              throw new Error('Invalid calculation response');
            }
            setUpdated({ a: output.a, b: output.b, sum: output.sum });
            setCount(value => value + 1);
          } catch {
            setError(
              'Unable to calculate. Your numbers are saved — please try again.',
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label style={{ display: 'block', marginBottom: 12 }}>
          First number{' '}
          <input
            type="number"
            step="any"
            required
            value={first}
            onChange={event => setFirst(event.target.value)}
            disabled={pending}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Second number{' '}
          <input
            type="number"
            step="any"
            required
            value={second}
            onChange={event => setSecond(event.target.value)}
            disabled={pending}
          />
        </label>
        <button type="submit" disabled={!mcpApp || pending || !valid}>
          {pending ? 'Calculating…' : 'Calculate'}
        </button>
      </form>
      {!mcpApp && <p>Connect to an MCP host to calculate.</p>}
      {error && <p role="alert">{error}</p>}
      <output
        aria-live="polite"
        aria-busy={pending}
        style={{ display: 'block', marginTop: 16 }}
      >
        <span style={{ display: 'block', fontSize: 28 }}>
          {result.a ?? '—'} + {result.b ?? '—'} = {result.sum ?? '—'}
        </span>
        {count > 0 && (
          <span style={{ display: 'block' }}>
            Successful calculations: {count}
          </span>
        )}
      </output>
    </section>
  );
}
