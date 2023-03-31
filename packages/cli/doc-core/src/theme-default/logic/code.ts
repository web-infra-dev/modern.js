import copy from 'copy-to-clipboard';
import highlight from 'highlight.js/lib/core';

let registeredLanguage = false;

export function setupCopyCodeButton() {
  const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();
  window.addEventListener('click', e => {
    const el = e.target as HTMLElement;
    if (
      el.matches('div[class*="language-"] .modern-code-content > button.copy')
    ) {
      const parent = el.parentElement;
      const sibling = el.nextElementSibling as HTMLPreElement | null;
      if (!parent || !sibling) {
        return;
      }

      const { innerText: text = '' } = sibling;
      const isCopied = copy(text);

      if (isCopied) {
        el.classList.add('copied');
        clearTimeout(timeoutIdMap.get(el));
        const timeoutId = setTimeout(() => {
          el.classList.remove('copied');
          el.blur();
          timeoutIdMap.delete(el);
        }, 2000);
        timeoutIdMap.set(el, timeoutId);
      }
    }
  });
}

export function registerLanguages() {
  highlight.registerLanguage(
    'js',
    require('highlight.js/lib/languages/javascript'),
  );
  highlight.registerLanguage(
    'jsx',
    require('highlight.js/lib/languages/javascript'),
  );
  highlight.registerLanguage(
    'ts',
    require('highlight.js/lib/languages/typescript'),
  );
  highlight.registerLanguage(
    'tsx',
    require('highlight.js/lib/languages/typescript'),
  );
  highlight.registerLanguage(
    'json',
    require('highlight.js/lib/languages/json'),
  );
  highlight.registerLanguage('css', require('highlight.js/lib/languages/css'));
  highlight.registerLanguage(
    'scss',
    require('highlight.js/lib/languages/scss'),
  );
  highlight.registerLanguage(
    'less',
    require('highlight.js/lib/languages/less'),
  );
  highlight.registerLanguage('html', require('highlight.js/lib/languages/xml'));
  highlight.registerLanguage(
    'yaml',
    require('highlight.js/lib/languages/yaml'),
  );
  highlight.registerLanguage(
    'diff',
    require('highlight.js/lib/languages/diff'),
  );
  highlight.registerLanguage(
    'bash',
    require('highlight.js/lib/languages/bash'),
  );
  highlight.registerLanguage(
    'shell',
    require('highlight.js/lib/languages/bash'),
  );
  highlight.registerLanguage(
    'md',
    require('highlight.js/lib/languages/markdown'),
  );
}

export function highlightCode() {
  if (!registeredLanguage) {
    // registerLanguages();
    registeredLanguage = true;
  }
  document.querySelectorAll('pre.code code').forEach(el => {
    const codeBlocks = el.innerHTML.split('\n');
    const meta = el.getAttribute('meta');
    let highlightMeta = '';
    let highlightLines: number[] = [];
    if (meta) {
      const highlightReg = /{[\d,-]*}/i;
      highlightMeta = highlightReg.exec(meta)?.[0] || '';
      if (highlightMeta) {
        highlightLines = highlightMeta
          .replace(/[{}]/g, '')
          .split(',')
          .map(item => {
            const [start, end] = item.split('-');
            if (end) {
              return Array.from(
                { length: Number(end) - Number(start) + 1 },
                (_, i) => i + Number(start),
              );
            }
            return Number(start);
          })
          .flat();
      }
    }
    // insert every code line and add `line` classNamex for every line
    // Then use highlight.js to highlight the code
    el.innerHTML = codeBlocks
      .map((code, index) => {
        if (index === codeBlocks.length - 1 && code === '') {
          return '';
        }
        const lineNumber = index + 1;
        const isHighlight = highlightLines.includes(lineNumber);
        return `<span class="line ${
          isHighlight ? 'highlighted' : ''
        }">${code}</span>`;
      })
      .join('\n');
    // use highlight.js to highlight the code for every span element in el
    // and highlight the code for every span element
    if (el.childNodes.length) {
      el.childNodes.forEach(child => {
        if (child.nodeName === 'SPAN') {
          highlight.highlightElement(child as HTMLElement);
        }
      });
    }
  });
}
