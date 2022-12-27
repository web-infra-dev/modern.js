import copy from 'copy-to-clipboard';

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
        el.style.transform = 'scale(0.33)';
        el.classList.add('copied');
        setTimeout(() => {
          el.style.transform = 'scale(1)';
        }, 160);
        clearTimeout(timeoutIdMap.get(el));
        const timeoutId = setTimeout(() => {
          el.classList.remove('copied');
          el.style.transform = 'scale(1)';
          el.blur();
          timeoutIdMap.delete(el);
        }, 2000);
        timeoutIdMap.set(el, timeoutId);
      }
    }
  });
}
