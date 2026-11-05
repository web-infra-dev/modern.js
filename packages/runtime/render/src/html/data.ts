const ESCAPES: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/** JSON that can be embedded in either executable or application/json scripts. */
export function serializeRenderData(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new TypeError('Render data must have a JSON representation');
  }
  return json.replace(/[<>/\u2028\u2029]/g, char => ESCAPES[char]);
}

export function escapeHtmlAttribute(value: string): string {
  const escapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, char => escapes[char]);
}

export interface DataScriptOptions {
  data: unknown;
  id?: string;
  name?: string;
  /** Existing framework global, without the window prefix. */
  global?: string;
  nonce?: string;
  serialize?: (value: unknown) => string;
}

export function createDataScript({
  data,
  id,
  name,
  global,
  nonce,
  serialize = serializeRenderData,
}: DataScriptOptions): string {
  const json = serialize(data);
  const nonceAttribute =
    nonce === undefined ? '' : ` nonce="${escapeHtmlAttribute(nonce)}"`;
  if (global) {
    if (!/^[\w$]+(?:\.[\w$]+)*$/.test(global)) {
      throw new TypeError('Invalid render data global');
    }
    return `<script${nonceAttribute}>window.${global} = ${json}</script>`;
  }
  if (name) {
    return `<script name="${escapeHtmlAttribute(name)}" type="application/json"${nonceAttribute}>${json}</script>`;
  }
  const identifier = id ? ` id="${escapeHtmlAttribute(id)}"` : '';
  return `<script type="application/json"${identifier}${nonceAttribute}>${json}</script>`;
}

export interface DataDocument {
  getElementById(id: string): { textContent: string | null } | null;
  getElementsByName(name: string): ArrayLike<{ textContent: string | null }>;
  querySelectorAll?(
    selector: string,
  ): ArrayLike<{ textContent: string | null }>;
}

/** The document is injected so the common entry is also usable on the server. */
export function readDataScript<T = unknown>(
  document: DataDocument,
  selector: { id: string; last?: boolean } | { name: string },
): T | undefined {
  let script;
  if ('id' in selector) {
    if (selector.last && document.querySelectorAll) {
      const scripts = document.querySelectorAll(`#${selector.id}`);
      script = scripts[scripts.length - 1];
    } else {
      script = document.getElementById(selector.id);
    }
  } else {
    script = document.getElementsByName(selector.name)[0];
  }
  return script ? (JSON.parse(script.textContent || '') as T) : undefined;
}
