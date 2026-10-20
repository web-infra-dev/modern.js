import { MCP_VIEW_META_KEY, readMcpViewResult } from '../view-result';
import type {
  McpUiResourceMeta,
  McpUiHostContext,
} from '@modelcontextprotocol/ext-apps';
import {
  appTools,
  assertAppTool,
  readHtmlResource,
  disposeBridge,
  disposePreview,
  externalUrl,
  downloadName,
} from './protocol';
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
  inputSchema: { type: 'object'; [key: string]: any };
  _meta?: {
    ui?: { resourceUri?: string; visibility?: Array<'model' | 'app'> };
  };
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
  sandboxUrl?: string;
  views?: Array<{ name: string; url: string }>;
}

/** Development host. Calls the real endpoint and uses the official app bridge. */
export function McpInspector({
  endpoint = '',
  views = [],
  sandboxUrl,
}: McpInspectorProps) {
  const [modelContext, setModelContext] = useState<unknown>();
  const [messages, setMessages] = useState<unknown[]>([]);
  const [appToolList, setAppToolList] = useState<Tool[]>([]);
  const [appToolName, setAppToolName] = useState('');
  const [appToolArgs, setAppToolArgs] = useState('{}');
  const [appToolOutput, setAppToolOutput] = useState('');
  const activeRequest = useRef<AbortController | null>(null);
  const proxyListener = useRef<(() => void) | undefined>(undefined);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [logFilter, setLogFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>();
  const hasPreview = previewUrl !== undefined;
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
  const initialized = useRef(false);
  const hostContext = useRef<McpUiHostContext>({});
  function updateHostContext(change: Partial<McpUiHostContext>) {
    hostContext.current = { ...hostContext.current, ...change };
    if (initialized.current)
      bridge.current?.setHostContext(hostContext.current);
  }
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
      proxyListener.current?.();
      activeRequest.current?.abort();
      void disposeBridge(bridge.current).catch(() => {});
      void client.current?.close();
    },
    [],
  );

  async function rpc(
    method: string,
    params?: Record<string, unknown>,
    notification = false,
    source: RequestLog['source'] = 'inspector',
    signal?: AbortSignal,
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
        signal,
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
  async function closePreview() {
    const host = bridge.current;
    await disposePreview(host, () => {
      if (bridge.current !== host) return;
      bridge.current = null;
      initialized.current = false;
      setAppToolList([]);
      setAppToolName('');
      setAppToolOutput('');
      proxyListener.current?.();
      setPreviewUrl(undefined);
    });
  }
  async function connect(target = address) {
    await closePreview();
    await client.current?.close();
    client.current = new McpInspectorClient(new URL(target, location.href));
    await rpc('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {
        extensions: {
          'io.modelcontextprotocol/ui': {
            mimeTypes: ['text/html;profile=mcp-app'],
          },
        },
      },
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
      activeRequest.current = null;
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
    ui: McpUiResourceMeta = {},
  ) {
    const iframe = frame.current;
    if (!iframe?.contentWindow) throw new Error('Preview frame unavailable');
    await disposeBridge(bridge.current).catch(() => {});
    proxyListener.current?.();
    setAppToolList([]);
    setAppToolName('');
    setAppToolOutput('');
    setModelContext(undefined);
    setMessages([]);
    setFullscreen(false);
    initialized.current = false;
    hostContext.current = {
      theme: matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
      locale: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: 'web',
      containerDimensions: { width: iframe.clientWidth, maxHeight: 1000 },
      ...(tools.find(tool => tool.name === selected)
        ? { toolInfo: { tool: tools.find(tool => tool.name === selected)! } }
        : {}),
      displayMode: 'inline',
      availableDisplayModes: ['inline', 'fullscreen'],
    };
    const host = new AppBridge(
      null,
      { name: 'Modern.js inspector', version: '1' },
      {
        ...(simulate ? {} : { serverTools: {}, serverResources: {} }),
        sandbox: { permissions: {}, csp: ui.csp ?? {} },
        openLinks: {},
        downloadFile: {},
        logging: {},
        message: {
          text: {},
          image: {},
          audio: {},
          resource: {},
          resourceLink: {},
          structuredContent: {},
        },
        updateModelContext: {
          text: {},
          image: {},
          audio: {},
          resource: {},
          resourceLink: {},
          structuredContent: {},
        },
      },
      {
        hostContext: hostContext.current,
      },
    );
    bridge.current = host;
    host.onrequestdisplaymode = async ({ mode }) => {
      const supported = host.getAppCapabilities()?.availableDisplayModes;
      const acceptedMode =
        (mode === 'inline' || mode === 'fullscreen') &&
        (!supported || supported.includes(mode))
          ? mode
          : (hostContext.current.displayMode ?? 'inline');
      setFullscreen(acceptedMode === 'fullscreen');
      updateHostContext({
        displayMode: acceptedMode,
        availableDisplayModes: ['inline', 'fullscreen'],
      });
      return { mode: acceptedMode };
    };
    host.oncalltool = async (params, extra) => {
      assertAppTool(tools, params.name);
      const next = (await rpc(
        'tools/call',
        params,
        false,
        'card',
        extra.mcpReq.signal,
      )) as CallToolResult;
      setOutput(JSON.stringify(next, null, 2));
      return next;
    };
    host.setRequestHandler('tools/list', async () => ({
      tools: appTools(tools),
    }));
    host.onreadresource = async (params, extra) =>
      rpc('resources/read', params, false, 'card', extra.mcpReq.signal);
    host.onlistresources = async (params, extra) =>
      rpc('resources/list', params, false, 'card', extra.mcpReq.signal);
    host.onupdatemodelcontext = async params => {
      setModelContext(params);
      return {};
    };
    host.onmessage = async params => {
      setMessages(previous => [...previous, params].slice(-100));
      return {};
    };
    host.onloggingmessage = params =>
      setMessages(previous => [...previous, { log: params }].slice(-100));
    host.onopenlink = async ({ url }) => {
      const target = externalUrl(url);
      if (!window.confirm(`Open ${target}?`)) return { isError: true };
      window.open(target, '_blank', 'noopener,noreferrer');
      return {};
    };
    host.ondownloadfile = async ({ contents }) => {
      if (!window.confirm(`Download ${contents.length} file(s)?`))
        return { isError: true };
      for (const item of contents) {
        let resource;
        let downloaded: Blob | undefined;
        if (item.type === 'resource') resource = item.resource;
        else if (/^https?:\/\//i.test(item.uri)) {
          const response = await fetch(externalUrl(item.uri));
          if (!response.ok)
            throw new Error(`Download failed: HTTP ${response.status}`);
          downloaded = await response.blob();
          resource = { uri: item.uri };
        } else {
          if (simulate)
            throw new Error('Connect a server to read resource links');
          const read = await rpc(
            'resources/read',
            { uri: item.uri },
            false,
            'card',
          );
          resource = read.contents?.find(
            (content: { uri: string }) => content.uri === item.uri,
          );
        }
        if (!resource) throw new Error('Download resource unavailable');
        const blob =
          downloaded ??
          new Blob(
            [
              resource.blob === undefined
                ? (resource.text ?? '')
                : Uint8Array.from(atob(resource.blob), char =>
                    char.charCodeAt(0),
                  ),
            ],
            { type: resource.mimeType ?? 'application/octet-stream' },
          );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName(resource.uri);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      return {};
    };
    host.setNotificationHandler(
      'notifications/tools/list_changed',
      async () => {
        if (bridge.current !== host || !host.getAppCapabilities()?.tools)
          return;
        const registered = await host.listTools({});
        if (bridge.current === host) setAppToolList(registered.tools);
      },
    );
    host.onrequestteardown = () => {
      void disposeBridge(host)
        .catch(() => {})
        .finally(() => {
          if (bridge.current === host) {
            bridge.current = null;
            initialized.current = false;
            proxyListener.current?.();
            setPreviewUrl(undefined);
            setAppToolList([]);
            setAppToolName('');
            setAppToolOutput('');
          }
        });
    };
    host.oninitialized = async () => {
      if (bridge.current !== host) return;
      initialized.current = true;
      updateHostContext({});
      clearTimeout(previewTimeout.current);
      try {
        await host.sendToolInput({ arguments: input });
        await host.sendToolResult(result);
        setStatus('Card connected');
        if (host.getAppCapabilities()?.tools) {
          const registered = await host.listTools({});
          if (bridge.current === host) setAppToolList(registered.tools);
        }
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
    if (!sandboxUrl)
      throw new Error('Inspector requires a cross-origin sandbox URL');
    const sandbox = new URL(sandboxUrl);
    if (sandbox.origin === location.origin)
      throw new Error('Sandbox must have a different origin');
    sandbox.searchParams.set('parentOrigin', location.origin);
    const ready = (event: MessageEvent) => {
      if (
        event.source !== iframe.contentWindow ||
        event.origin !== sandbox.origin ||
        event.data?.method !== 'ui/notifications/sandbox-proxy-ready'
      )
        return;
      iframe.contentWindow?.postMessage(
        {
          jsonrpc: '2.0',
          method: 'ui/notifications/sandbox-resource-ready',
          params: { html, csp: ui.csp },
        },
        sandbox.origin,
      );
    };
    window.addEventListener('message', ready);
    const theme = matchMedia('(prefers-color-scheme: dark)');
    const changed = () =>
      updateHostContext({ theme: theme.matches ? 'dark' : 'light' });
    theme.addEventListener('change', changed);
    const resize = new ResizeObserver(() =>
      updateHostContext({
        containerDimensions: { width: iframe.clientWidth, maxHeight: 1000 },
      }),
    );
    resize.observe(iframe.parentElement!);
    proxyListener.current = () => {
      window.removeEventListener('message', ready);
      theme.removeEventListener('change', changed);
      resize.disconnect();
    };
    setPreviewUrl(sandbox.href);
  }
  async function execute() {
    const input = object(args);
    activeRequest.current = new AbortController();
    setStatus('Running…');
    clearTimeout(previewTimeout.current);
    await closePreview();
    setModelContext(undefined);
    setMessages([]);

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
        _meta: {
          [MCP_VIEW_META_KEY]: {
            version: 1,
            args: input,
            viewProps: object(props),
          },
        },
      };
      setOutput(JSON.stringify(result, null, 2));
      await preview(html, input, result, {
        csp: {
          resourceDomains: [location.origin],
          connectDomains: [location.origin],
          baseUriDomains: [location.origin],
        },
      });
    } else {
      if (!activeAddress.current || activeAddress.current !== address)
        await connect();
      const result = (await rpc(
        'tools/call',
        {
          name: selected,
          arguments: input,
        },
        false,
        'inspector',
        activeRequest.current.signal,
      )) as CallToolResult;
      setOutput(JSON.stringify(result, null, 2));
      setStatus(
        `${result.isError ? 'Tool error' : 'Completed'} in ${Math.round(performance.now() - start)} ms`,
      );
      const uri = tools.find(tool => tool.name === selected)?._meta?.ui
        ?.resourceUri;
      if (uri && !result.isError) {
        const resource = await rpc('resources/read', { uri });
        const listed = await rpc('resources/list');
        const fallback = listed.resources?.find(
          (item: { uri: string }) => item.uri === uri,
        )?._meta?.ui;
        const { html, ui } = readHtmlResource(
          resource.contents ?? [],
          uri,
          fallback,
        );
        activeRequest.current?.signal.throwIfAborted();
        await preview(html, input, result, ui);
      }
    }
  }
  const choices = simulate ? views : tools;
  const tool = tools.find(item => item.name === selected);
  const resourceUri = tool?._meta?.ui?.resourceUri;
  const isMfView = !simulate && resourceUri?.startsWith('ui://mf/');
  const resultResource = output
    ? readMcpViewResult(JSON.parse(output))?.resource
    : undefined;
  const mfResource = (
    resultResource as
      | { moduleFederation?: { resourceUri?: string; remoteEntry?: string } }
      | undefined
  )?.moduleFederation;
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
                onClick={() =>
                  void run(async () => {
                    await closePreview();
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
                  })
                }
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
              {busy && (
                <button
                  onClick={() => {
                    activeRequest.current?.abort();
                    if (initialized.current)
                      void bridge.current
                        ?.sendToolCancelled({
                          reason: 'Cancelled in Inspector',
                        })
                        .catch(() => {});
                  }}
                >
                  Cancel
                </button>
              )}
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
                  updateHostContext({
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
              src={previewUrl}
              title="MCP App preview"
              sandbox="allow-scripts allow-same-origin"
              style={{ display: hasPreview ? 'block' : 'none' }}
            />
          </div>
          <p className="note">
            Local previews help you iterate. Verify permissions and
            compatibility in your target host before release.
          </p>
          <section aria-label="App protocol state">
            <details>
              <summary>Model context</summary>
              <pre>{logJson(modelContext)}</pre>
            </details>
            <details>
              <summary>App messages and logs</summary>
              <pre>{logJson(messages)}</pre>
            </details>
            <details>
              <summary>App-provided tools</summary>
              <button
                onClick={() =>
                  void run(async () => {
                    const registered = await bridge.current?.listTools({});
                    setAppToolList(registered?.tools ?? []);
                  })
                }
                disabled={!hasPreview}
              >
                Refresh app tools
              </button>
              <select
                value={appToolName}
                onChange={event => setAppToolName(event.target.value)}
              >
                <option value="">Select app tool</option>
                {appToolList.map(item => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <textarea
                aria-label="App tool arguments"
                value={appToolArgs}
                onChange={event => setAppToolArgs(event.target.value)}
              />
              <button
                disabled={!appToolName || !hasPreview}
                onClick={() =>
                  void run(async () => {
                    activeRequest.current = new AbortController();
                    const result = await bridge.current?.callTool(
                      {
                        name: appToolName,
                        arguments: object(appToolArgs),
                      },
                      { signal: activeRequest.current.signal },
                    );
                    setAppToolOutput(logJson(result));
                  })
                }
              >
                Call app tool
              </button>
              <pre>{appToolOutput}</pre>
            </details>
          </section>
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
