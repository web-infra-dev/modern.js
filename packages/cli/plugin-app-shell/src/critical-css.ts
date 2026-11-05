import Beasties from 'beasties';
import postcss, { type Root } from 'postcss';

export interface CssSource {
  /** Public URL the stylesheet is served from; relative `url()`s resolve against it. */
  url: string;
  css: string;
  /**
   * Async chunks are only scanned for rules that target shell elements: their global
   * rules (`:root` tokens, resets) duplicate or override the initial stylesheets.
   */
  async?: boolean;
}

export interface ExtractCriticalCssOptions {
  /** Static shell markup, as it is injected into the page. */
  shellHtml: string;
  /** Attributes of the page `<html>` tag, e.g. `data-theme="light"`. */
  htmlAttributes: string;
  sources: CssSource[];
  allowRules: (string | RegExp)[];
}

export const DEFAULT_ALLOW_RULES: RegExp[] = [
  // Theme variables and global resets that apply before any element matches.
  /^(:root|html|body)(\[[^\]]*\])*$/,
  /^\[(data-)?theme(-mode)?=[^\]]*\]$/,
  /^:host\(/,
];

const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

const isAbsoluteUrl = (value: string): boolean =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(value);

/** Inlined CSS no longer lives next to its assets, so relative `url()`s are made absolute. */
export const rewriteRelativeUrls = (
  css: string,
  stylesheetUrl: string,
): string =>
  css.replace(URL_RE, (match: string, quote: string, value: string) => {
    if (isAbsoluteUrl(value)) {
      return match;
    }
    const base = stylesheetUrl.startsWith('//')
      ? `https:${stylesheetUrl}`
      : stylesheetUrl;
    let resolved: string;
    try {
      resolved = new URL(value, new URL(base, 'https://app-shell.invalid/'))
        .href;
    } catch {
      return match;
    }
    if (resolved.startsWith('https://app-shell.invalid')) {
      resolved = resolved.slice('https://app-shell.invalid'.length);
    } else if (stylesheetUrl.startsWith('//')) {
      resolved = resolved.slice('https:'.length);
    }
    return `url(${quote}${resolved}${quote})`;
  });

const escapeStyleText = (css: string): string =>
  css.replace(/<\/style/gi, '<\\/style');

const decodeAttribute = (value: string): string =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const collectClassNames = (html: string): string[] => {
  const names = new Set<string>();
  const re = /\sclass=(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null = re.exec(html);
  while (match) {
    for (const name of decodeAttribute(match[1] ?? match[2]).split(/\s+/)) {
      if (name) {
        names.add(name);
      }
    }
    match = re.exec(html);
  }
  return [...names];
};

/** CSS class selector for a class name, escaped the way minifiers emit it. */
const toClassSelector = (name: string): string =>
  `.${name.replace(/^(\d)/, '\\3$1 ').replace(/[^\w-]/g, '\\$&')}`;

const mentionsAnyClass = (css: string, classNames: string[]): boolean =>
  classNames.some(name => css.includes(toClassSelector(name)));

const hasElementTarget = (selector: string): boolean => /[.#[]/.test(selector);

/** Drop rules that only target global elements, e.g. `:root`, `*`, `body`. */
const stripGlobalRules = (css: string): string => {
  const root: Root = postcss.parse(css);
  root.walkRules(rule => {
    if (rule.selectors.every(selector => !hasElementTarget(selector))) {
      rule.remove();
    }
  });
  root.walkAtRules(atRule => {
    if (atRule.nodes && atRule.nodes.length === 0) {
      atRule.remove();
    }
  });
  return root.toString();
};

/** Remove top-level rules already present (same text) earlier in the output. */
const dedupeRules = (css: string): string => {
  const root: Root = postcss.parse(css);
  const seen = new Set<string>();
  for (const node of [...(root.nodes || [])]) {
    const text = node.toString();
    if (seen.has(text)) {
      node.remove();
    } else {
      seen.add(text);
    }
  }
  return root.toString();
};

const runBeasties = async (
  shellHtml: string,
  htmlAttributes: string,
  sources: CssSource[],
  allowRules: (string | RegExp)[],
): Promise<string> => {
  if (sources.length === 0) {
    return '';
  }
  const beasties = new Beasties({
    reduceInlineStyles: true,
    pruneSource: false,
    mergeStylesheets: true,
    compress: true,
    keyframes: 'critical',
    fonts: false,
    allowRules,
    logLevel: 'silent',
  });
  const styles = sources
    .map(source => {
      const css = rewriteRelativeUrls(source.css, source.url);
      return `<style>${escapeStyleText(source.async ? stripGlobalRules(css) : css)}</style>`;
    })
    .join('');
  const document = `<!doctype html><html ${htmlAttributes}><head>${styles}</head><body>${shellHtml}</body></html>`;
  const output = await beasties.process(document);
  const critical: string[] = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match: RegExpExecArray | null = styleRe.exec(output);
  while (match) {
    critical.push(match[1]);
    match = styleRe.exec(output);
  }
  return critical.join('');
};

/**
 * Keep only the rules of `sources` that match an element of the shell markup.
 * Pseudo classes and elements are ignored while matching, so `:hover` or `::after`
 * rules of shell elements are kept as well. Initial stylesheets come first so the
 * cascade order matches the page once they load.
 */
export const extractCriticalCss = async ({
  shellHtml,
  htmlAttributes,
  sources,
  allowRules,
}: ExtractCriticalCssOptions): Promise<string> => {
  const initial = await runBeasties(
    shellHtml,
    htmlAttributes,
    sources.filter(source => !source.async),
    allowRules,
  );
  // Most async chunks style nothing in the shell; skip them before the costly matching.
  const classNames = collectClassNames(shellHtml);
  const asyncCss = await runBeasties(
    shellHtml,
    htmlAttributes,
    sources.filter(
      source => source.async && mentionsAnyClass(source.css, classNames),
    ),
    [],
  );
  return asyncCss ? dedupeRules(initial + asyncCss) : initial;
};
