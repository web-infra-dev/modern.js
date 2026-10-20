import type { CallToolResult } from '@modelcontextprotocol/client';
import {
  AppBridge,
  PostMessageTransport,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import React, { useEffect, useRef, useState } from 'react';
import { McpInspectorClient } from './client';
import inspectorStyles from './styles.css?raw';
import { schemaExample } from './schema';

interface Tool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  _meta?: { ui?: { resourceUri?: string } };
}
interface RequestLog {
  id: string;
  time: number;
  method: string;
  endpoint: string;
  source: 'inspector' | 'card';
  params?: Record<string, unknown>;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  response?: unknown;
  error?: string;
}

function logJson(value: unknown) {
  const text = JSON.stringify(value, null, 2) ?? '(no response body)';
  return text.length > 16000
    ? `${text.slice(0, 16000)}\n… Display truncated`
    : text;
}

export interface McpInspectorProps {
  endpoint?: string;
  views?: Array<{ name: string; url: string }>;
}

/** Development host. Calls the real endpoint and uses the official app bridge. */
export function McpInspector({ endpoint = '', views = [] }: McpInspectorProps) {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [logFilter, setLogFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string>();
  const hasPreview = previewHtml !== undefined;
  const [address, setAddress] = useState(endpoint);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState('');
  const [args, setArgs] = useState('{}');
  const [props, setProps] = useState('{}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [simulate, setSimulate] = useState(!endpoint);
  const frame = useRef<HTMLIFrameElement>(null);
  const bridge = useRef<AppBridge | null>(null);
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const client = useRef<McpInspectorClient | null>(null);
  const activeAddress = useRef('');
  const autoConnectedEndpoint = useRef('');
  useEffect(() => {
    if (!endpoint || autoConnectedEndpoint.current === endpoint) return;
    autoConnectedEndpoint.current = endpoint;
    const target = new URL(endpoint, window.location.href).href;
    setAddress(target);
    void run(() => discover(target));
  }, [endpoint]);
  useEffect(
    () => () => {
      clearTimeout(previewTimeout.current);
      void bridge.current?.close();
    },
    [],
  );

  async function rpc(
    method: string,
    params?: Record<string, unknown>,
    notification = false,
    source: RequestLog['source'] = 'inspector',
  ) {
    if (!client.current) throw new Error('Connect to an MCP endpoint first');
    const id = crypto.randomUUID();
    const start = performance.now();
    const entry: RequestLog = {
      id,
      time: Date.now(),
      method,
      params,
      endpoint: new URL(address, location.href).href,
      source,
      status: 'pending',
    };
    setLogs(previous => [entry, ...previous].slice(0, 100));
    try {
      const response = await client.current.request(
        method,
        params,
        notification,
      );
      setLogs(previous =>
        previous.map(item =>
          item.id === id
            ? {
                ...item,
                duration: Math.round(performance.now() - start),
                status: response?.isError ? 'error' : 'success',
                response,
              }
            : item,
        ),
      );
      return response;
    } catch (cause) {
      setLogs(previous =>
        previous.map(item =>
          item.id === id
            ? {
                ...item,
                duration: Math.round(performance.now() - start),
                status: 'error',
                error: cause instanceof Error ? cause.message : String(cause),
              }
            : item,
        ),
      );
      throw cause;
    }
  }
  async function connect(target = address) {
    client.current = new McpInspectorClient(new URL(target, location.href));
    await rpc('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'modern-mcp-inspector', version: '1.0.0' },
    });
    await rpc('notifications/initialized', undefined, true);
    activeAddress.current = target;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('Failed');
    } finally {
      setBusy(false);
    }
  }
  function object(text: string) {
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error(
        'Arguments must be valid JSON. Use double quotes for keys and strings, for example: {"name":"Ada"}',
      );
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Input must be a JSON object');
    return value as Record<string, unknown>;
  }
  async function preview(
    html: string,
    input: Record<string, unknown>,
    result: CallToolResult,
  ) {
    const iframe = frame.current;
    if (!iframe?.contentWindow) throw new Error('Preview frame unavailable');
    await bridge.current?.close();
    setFullscreen(false);
    const host = new AppBridge(
      null,
      { name: 'Modern.js inspector', version: '1' },
      simulate ? {} : { serverTools: {} },
      {
        hostContext: {
          displayMode: 'inline',
          availableDisplayModes: ['inline', 'fullscreen'],
        },
      },
    );
    bridge.current = host;
    host.onrequestdisplaymode = async ({ mode }) => {
      const acceptedMode = mode === 'fullscreen' ? 'fullscreen' : 'inline';
      setFullscreen(acceptedMode === 'fullscreen');
      host.setHostContext({
        displayMode: acceptedMode,
        availableDisplayModes: ['inline', 'fullscreen'],
      });
      return { mode: acceptedMode };
    };
    host.oncalltool = async params => {
      const next = (await rpc(
        'tools/call',
        params,
        false,
        'card',
      )) as CallToolResult;
      setOutput(JSON.stringify(next, null, 2));
      return next;
    };
    host.oninitialized = async () => {
      clearTimeout(previewTimeout.current);
      try {
        await host.sendToolInput({ arguments: input });
        await host.sendToolResult(result);
        setStatus('Card connected');
      } catch (cause) {
        setError(`Card communication: ${String(cause)}`);
      }
    };
    host.onerror = cause => setError(`Card communication: ${cause.message}`);
    host.onsizechange = ({ height }) => {
      if (height)
        iframe.style.height = `${Math.min(Math.max(height, 200), 1000)}px`;
    };
    await host.connect(
      new PostMessageTransport(iframe.contentWindow, iframe.contentWindow),
    );
    setStatus('Loading card…');
    clearTimeout(previewTimeout.current);
    previewTimeout.current = setTimeout(() => {
      setStatus('Card connection timed out');
      setError(
        'The UI resource was received, but the card did not complete its host handshake. Check iframe script loading and the browser console.',
      );
    }, 15000);
    setPreviewHtml(html);
  }
  async function execute() {
    const input = object(args);
    setStatus('Running…');
    setPreviewHtml(undefined);
    clearTimeout(previewTimeout.current);
    await bridge.current?.close();

    const start = performance.now();
    if (simulate) {
      const view = views.find(item => item.name === selected);
      if (!view) throw new Error('Select a local view to simulate');
      const response = await fetch(view.url);
      if (!response.ok) throw new Error(`UI resource: HTTP ${response.status}`);
      const html = (await response.text()).replace(
        /<head\b[^>]*>/i,
        head => `${head}<base href="${location.origin}/">`,
      );
      const result = {
        content: [],
        structuredContent: { args: input, viewProps: object(props) },
      };
      setOutput(JSON.stringify(result, null, 2));
      await preview(html, input, result);
    } else {
      if (!activeAddress.current || activeAddress.current !== address)
        await connect();
      const result = (await rpc('tools/call', {
        name: selected,
        arguments: input,
      })) as CallToolResult;
      setOutput(JSON.stringify(result, null, 2));
      setStatus(
        `${result.isError ? 'Tool error' : 'Completed'} in ${Math.round(performance.now() - start)} ms`,
      );
      const uri = tools.find(tool => tool.name === selected)?._meta?.ui
        ?.resourceUri;
      if (uri && !result.isError) {
        const resource = await rpc('resources/read', { uri });
        const html = resource.contents?.find(
          (item: { text?: string }) => typeof item.text === 'string',
        )?.text;
        if (!html) throw new Error('UI resource did not return HTML');
        await preview(html, input, result);
      }
    }
  }
  const choices = simulate ? views : tools;
  const tool = tools.find(item => item.name === selected);
  const resourceUri = tool?._meta?.ui?.resourceUri;
  const isMfView = !simulate && resourceUri?.startsWith('ui://mf/');
  const resultResource = output
    ? JSON.parse(output)?.structuredContent?.resource
    : undefined;
  const mfResource = resultResource?.moduleFederation;
  const manifestUrl =
    !simulate &&
    mfResource?.resourceUri === resourceUri &&
    typeof mfResource?.remoteEntry === 'string'
      ? mfResource.remoteEntry
      : undefined;
  async function discover(target = address) {
    setStatus('Connecting…');
    await connect(target);
    const found: Tool[] = [];
    let cursor: string | undefined;
    do {
      const page = await rpc('tools/list', cursor ? { cursor } : {});
      found.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    setTools(found);
    setSelected(found[0]?.name ?? '');
    setArgs(
      JSON.stringify(
        schemaExample(found[0]?.inputSchema ?? { type: 'object' }),
        null,
        2,
      ),
    );
    setStatus(`${found.length} tools discovered`);
  }
  return (
    <main className="mcp-inspector">
      <style>{inspectorStyles}</style>
      <header>
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <h1>MCP Apps Inspector</h1>
            <div className="caption">Modern.js developer tools</div>
          </div>
          <span className="badge">LOCAL</span>
        </div>
        <div className="mode" aria-label="Inspector mode">
          <button
            disabled={busy}
            aria-pressed={!simulate}
            onClick={() => {
              setSimulate(false);
              setSelected('');
            }}
          >
            Live server
          </button>
          <button
            disabled={busy}
            aria-pressed={simulate}
            onClick={() => {
              setSimulate(true);
              setSelected('');
            }}
          >
            Simulate local UI
          </button>
        </div>
      </header>
      <div className="connection">
        <label htmlFor="mcp-endpoint">ENDPOINT</label>
        <input
          id="mcp-endpoint"
          aria-label="MCP endpoint"
          disabled={busy || simulate}
          value={address}
          onChange={event => setAddress(event.target.value)}
          placeholder="http://localhost:8080/mcp"
        />
        <button
          className="primary"
          disabled={busy || !address || simulate}
          onClick={() => void run(discover)}
        >
          {busy ? 'Working…' : 'Connect & discover'}
        </button>
        <span className="status" role="status">
          {simulate ? 'Local preview · no server required' : status}
        </span>
      </div>
      <div className="workspace">
        <aside>
          <div className="section-label">
            TOOLS <span>{choices.length}</span>
          </div>
          <input
            className="search"
            aria-label="Search tools"
            placeholder="Search tools…"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {choices
            .filter(item =>
              item.name.toLowerCase().includes(search.toLowerCase()),
            )
            .map(item => (
              <button
                className="tool"
                disabled={busy}
                key={item.name}
                aria-pressed={selected === item.name}
                onClick={() => {
                  setSelected(item.name);
                  setArgs(
                    JSON.stringify(
                      schemaExample(
                        tools.find(tool => tool.name === item.name)
                          ?.inputSchema ?? { type: 'object' },
                      ),
                      null,
                      2,
                    ),
                  );
                  setOutput('');
                  setError('');
                  setPreviewHtml(undefined);
                }}
              >
                <strong>{item.name}</strong>
                <small>
                  {simulate ||
                  tools.find(tool => tool.name === item.name)?._meta?.ui
                    ?.resourceUri
                    ? 'Interactive card'
                    : 'Server tool'}
                </small>
              </button>
            ))}
          {!choices.length && (
            <div className="empty">
              <div className="empty-icon">⌘</div>
              <strong>No tools yet</strong>
              {simulate
                ? 'Local component views will appear here.'
                : 'Connect to your MCP server to discover available tools.'}
            </div>
          )}
          {!!choices.length &&
            !choices.some(item =>
              item.name.toLowerCase().includes(search.toLowerCase()),
            ) && <div className="empty">No matching tools</div>}
          <section className="editor" aria-label="Tool editor">
            <div className="section-label">TOOL WORKSPACE</div>
            <h2>{selected || 'Explore your tools'}</h2>
            <p>
              {tool?.description ||
                'Select a tool, provide arguments, and inspect its response.'}
            </p>
            {tool?.inputSchema?.properties != null && !simulate && (
              <div className="schema-fields">
                {Object.entries(
                  tool.inputSchema.properties as Record<
                    string,
                    Record<string, unknown>
                  >,
                ).map(([key, field]) => (
                  <div key={key}>
                    <code>{key}</code>
                    <span>
                      {Array.isArray(field.type)
                        ? field.type.join(' | ')
                        : String(field.type ?? 'value')}
                      {Array.isArray(tool.inputSchema?.required) &&
                      tool.inputSchema.required.includes(key)
                        ? ' · required'
                        : ' · optional'}
                    </span>
                    {typeof field.description === 'string' && (
                      <small>{field.description}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="panel">
              <div className="panel-title">
                <label htmlFor="mcp-args">Arguments</label>
                <span>JSON</span>
              </div>
              <textarea
                id="mcp-args"
                aria-label="Arguments"
                value={args}
                onChange={event => setArgs(event.target.value)}
                spellCheck={false}
              />
            </div>
            {simulate && (
              <div className="panel">
                <div className="panel-title">
                  <label htmlFor="mcp-props">View props</label>
                  <span>JSON</span>
                </div>
                <textarea
                  id="mcp-props"
                  aria-label="View props"
                  value={props}
                  onChange={event => setProps(event.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
            <p className="note">
              Use valid JSON with double-quoted keys and strings. Generated
              values are placeholders to edit before running.
            </p>
            <div className="actions">
              <button
                className="primary"
                disabled={busy || !selected}
                onClick={() => void run(execute)}
              >
                {busy ? 'Running…' : simulate ? 'Preview card' : 'Run tool'}{' '}
                <span aria-hidden="true">↗</span>
              </button>
              <span className="status" role="status">
                {status}
              </span>
            </div>
            {error && (
              <pre className="error" role="alert">
                {error}
              </pre>
            )}
            {tool && !simulate && (
              <details>
                <summary>Tool schema and UI resource</summary>
                <pre>{JSON.stringify(tool, null, 2)}</pre>
              </details>
            )}
          </section>
        </aside>
        <section
          className={`preview${fullscreen ? ' is-fullscreen' : ''}`}
          aria-label="Card preview"
        >
          <div className="preview-heading">
            <h2>Card preview</h2>
            {fullscreen && (
              <button
                type="button"
                onClick={() => {
                  setFullscreen(false);
                  bridge.current?.setHostContext({
                    displayMode: 'inline',
                    availableDisplayModes: ['inline', 'fullscreen'],
                  });
                }}
              >
                Exit fullscreen
              </button>
            )}
            <span>
              {simulate
                ? 'Local · simulation'
                : !resourceUri
                  ? 'No UI resource'
                  : isMfView
                    ? 'Module Federation'
                    : 'Local'}{' '}
              · AppBridge
            </span>
          </div>
          {resourceUri && !simulate && (
            <div className="view-resource">
              <div>
                <strong>Resource</strong>
                <code>{resourceUri}</code>
              </div>
              {isMfView && (
                <div>
                  <strong>MF manifest</strong>
                  <code>
                    {manifestUrl ?? 'Run the tool to resolve its manifest URL'}
                  </code>
                </div>
              )}
            </div>
          )}
          <div className="canvas">
            {!hasPreview && (
              <div className="empty">
                <div className="empty-icon">▧</div>
                <strong>Your app appears here</strong>Run a tool with a UI
                resource to preview its card.
                <br />
                Input and results are delivered through the host bridge.
              </div>
            )}
            <iframe
              key="mcp-app-preview"
              ref={frame}
              srcDoc={previewHtml}
              title="MCP App preview"
              sandbox="allow-scripts"
              style={{ display: hasPreview ? 'block' : 'none' }}
            />
          </div>
          <p className="note">
            Local previews help you iterate. Verify permissions and
            compatibility in your target host before release.
          </p>
        </section>
        <section className="activity" aria-label="Activity">
          <div className="section-label">ACTIVITY</div>
          <section className="request-logs panel" aria-label="Request logs">
            <div className="panel-title">
              <div>
                Request logs <span>{logs.length} / 100</span>
              </div>
              <div className="log-controls">
                <select
                  aria-label="Filter request logs"
                  value={logFilter}
                  onChange={event => setLogFilter(event.target.value)}
                >
                  <option value="all">All requests</option>
                  <option value="tools/call">Tool calls</option>
                  <option value="resources/read">Resource reads</option>
                  <option value="error">Errors</option>
                </select>
                <button onClick={() => setLogs([])} disabled={!logs.length}>
                  Clear
                </button>
              </div>
            </div>
            <div className="log-list">
              {logs
                .filter(
                  item =>
                    logFilter === 'all' ||
                    (logFilter === 'error'
                      ? item.status === 'error'
                      : item.method === logFilter),
                )
                .map(item => (
                  <details key={item.id} className="log-entry">
                    <summary>
                      <time>
                        {new Date(item.time).toLocaleTimeString([], {
                          hour12: false,
                        })}
                      </time>
                      <strong>{item.method}</strong>
                      <span className={`log-status ${item.status}`}>
                        {item.status}
                      </span>
                      <span>
                        {item.duration === undefined
                          ? '…'
                          : `${item.duration} ms`}
                      </span>
                    </summary>
                    <div className="log-meta">
                      {item.source === 'card'
                        ? 'Card → Server'
                        : 'Inspector → Server'}{' '}
                      · {item.endpoint}
                    </div>
                    <div className="log-body">
                      <label>Request params</label>
                      <pre>{logJson(item.params ?? {})}</pre>
                      <label>{item.error ? 'Error' : 'Response result'}</label>
                      <pre>
                        {item.error ??
                          (item.status === 'pending'
                            ? 'Waiting for response…'
                            : logJson(item.response))}
                      </pre>
                    </div>
                  </details>
                ))}
              {!logs.some(
                item =>
                  logFilter === 'all' ||
                  (logFilter === 'error'
                    ? item.status === 'error'
                    : item.method === logFilter),
              ) && (
                <div className="empty">
                  <strong>No requests to show</strong>Connection, tool calls and
                  resource reads appear here.
                </div>
              )}
            </div>
            <div className="log-footnote">
              Latest 100 requests · Current page only · Large responses are
              truncated for display
            </div>
          </section>
          <div className="panel">
            <div className="panel-title">
              Response<span>JSON-RPC</span>
            </div>
            {output ? (
              <pre>{output}</pre>
            ) : (
              <div className="empty">
                <strong>No response yet</strong>Run a tool to inspect its
                output.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
