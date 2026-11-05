import { createGateScript, LINK_SCRIPT, RUNTIME_SCRIPT } from './runtime';
import type { AppShellRuntimeConfig } from './types';

export const SHELL_ELEMENT_ID = '__modern_app_shell';

export interface InjectAppShellOptions {
  config: AppShellRuntimeConfig;
  shellHtml: string;
  criticalCss: string;
}

// Visible by default so the shell also paints without JavaScript; the gate script marks
// pathnames without a shell before the markup is parsed, so they never flash it.
const BASE_CSS = (id: string): string =>
  `#${id}{display:block;position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483600;overflow:hidden;background:var(--modern-app-shell-background,#fff)}` +
  `html[data-app-shell-off] #${id}{display:none}`;

const STYLESHEET_LINK_RE = /<link\b[^>]*\brel=(["']?)stylesheet\1[^>]*>/gi;

const attr = (tag: string, name: string): string | null => {
  const match = new RegExp(
    `\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag);
  if (!match) {
    return null;
  }
  return match[1] ?? match[2] ?? match[3] ?? '';
};

const escapeScript = (code: string): string =>
  code.replace(/<\/script/gi, '<\\/script');

const escapeStyle = (css: string): string =>
  css.replace(/<\/style/gi, '<\\/style');

/** Stylesheet `href`s linked from `<head>`, in document order. */
export const getHeadStylesheets = (html: string): string[] => {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html);
  if (!head) {
    return [];
  }
  const hrefs: string[] = [];
  for (const tag of head[1].match(STYLESHEET_LINK_RE) || []) {
    const href = attr(tag, 'href');
    if (href) {
      hrefs.push(href);
    }
  }
  return hrefs;
};

/** Attributes of the `<html>` tag, used to evaluate `html[...]` selectors. */
export const getHtmlAttributes = (html: string): string => {
  const match = /<html\b([^>]*)>/i.exec(html);
  return match ? match[1].trim() : '';
};

const findMountRange = (
  html: string,
  mountId: string,
): { openEnd: number; closeEnd: number } => {
  const escaped = mountId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const open = new RegExp(
    `<div\\b[^>]*\\sid=(["']?)${escaped}\\1(?=[\\s>])[^>]*>`,
    'i',
  ).exec(html);
  if (!open) {
    throw new Error(`[app-shell] mount node #${mountId} not found in HTML`);
  }
  const openEnd = open.index + open[0].length;
  const close = html.indexOf('</div>', openEnd);
  if (close === -1) {
    throw new Error(`[app-shell] mount node #${mountId} is not closed`);
  }
  if (/<div\b/i.test(html.slice(openEnd, close))) {
    // The template already renders markup into the mount node; leave it alone.
    throw new Error(
      `[app-shell] mount node #${mountId} is not empty in the HTML template`,
    );
  }
  return { openEnd, closeEnd: close + '</div>'.length };
};

const deferStylesheetLinks = (head: string): string =>
  head.replace(STYLESHEET_LINK_RE, tag => {
    const media = attr(tag, 'media');
    if (media && media !== 'all') {
      return tag;
    }
    const cleaned = tag.replace(/\smedia=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return cleaned.replace(
      /\s*\/?>$/,
      ` media="print" data-app-shell-defer="all">`,
    );
  });

/**
 * Inject a prerendered shell into an entry HTML template:
 * - a `<style>` with the shell's critical CSS and a gate script at the start of `<head>`,
 * - optionally non-blocking entry stylesheets,
 * - the shell markup and runtime script right after the (empty) mount node.
 * The mount node itself is untouched, so client rendering and hydration are unaffected.
 */
export const injectAppShell = (
  html: string,
  { config, shellHtml, criticalCss }: InjectAppShellOptions,
): string => {
  if (html.includes(`id="${config.id}"`)) {
    return html;
  }
  const headMatch = /<head\b[^>]*>/i.exec(html);
  const headClose = html.search(/<\/head>/i);
  if (!headMatch || headClose === -1) {
    throw new Error('[app-shell] <head> not found in HTML');
  }
  const headOpenEnd = headMatch.index + headMatch[0].length;

  const headStart =
    `<style data-app-shell-style>${escapeStyle(BASE_CSS(config.id) + criticalCss)}</style>` +
    `<script data-app-shell-gate>${escapeScript(createGateScript(config))}</script>`;

  let head = html.slice(headOpenEnd, headClose);
  if (config.deferStylesheets && STYLESHEET_LINK_RE.test(head)) {
    STYLESHEET_LINK_RE.lastIndex = 0;
    head = deferStylesheetLinks(head);
    const lastLink = head.lastIndexOf('data-app-shell-defer');
    const insertAt = head.indexOf('>', lastLink) + 1;
    head =
      head.slice(0, insertAt) +
      `<script data-app-shell-links>${LINK_SCRIPT}</script>` +
      head.slice(insertAt);
  }
  STYLESHEET_LINK_RE.lastIndex = 0;

  const withHead =
    html.slice(0, headOpenEnd) + headStart + head + html.slice(headClose);

  const { closeEnd } = findMountRange(withHead, config.mountId);
  const shell =
    `<div id="${config.id}" data-app-shell-root>${shellHtml}</div>` +
    `<script data-app-shell-runtime>${escapeScript(RUNTIME_SCRIPT)}</script>`;
  return withHead.slice(0, closeEnd) + shell + withHead.slice(closeEnd);
};
