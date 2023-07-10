import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import scss from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import less from 'react-syntax-highlighter/dist/esm/languages/prism/less';
import xml from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import copy from 'copy-to-clipboard';
import { useRef } from 'react';
import style from './prisim-theme';
import { usePageData } from '@/runtime';

let registered = false;
const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();

export interface CodeProps {
  children: string;
  className: string;
  meta?: string;
}

function registerLanguages() {
  SyntaxHighlighter.registerLanguage('jsx', jsx);
  SyntaxHighlighter.registerLanguage('jsx', tsx);
  SyntaxHighlighter.registerLanguage('mdx', tsx);
  SyntaxHighlighter.registerLanguage('js', js);
  SyntaxHighlighter.registerLanguage('ts', ts);
  SyntaxHighlighter.registerLanguage('json', json);
  SyntaxHighlighter.registerLanguage('css', css);
  SyntaxHighlighter.registerLanguage('scss', scss);
  SyntaxHighlighter.registerLanguage('less', less);
  SyntaxHighlighter.registerLanguage('xml', xml);
  SyntaxHighlighter.registerLanguage('yaml', yaml);
  SyntaxHighlighter.registerLanguage('diff', diff);
  SyntaxHighlighter.registerLanguage('bash', bash);
  SyntaxHighlighter.registerLanguage('markdown', markdown);
  registered = true;
}

export function Code(props: CodeProps) {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const { siteData } = usePageData();
  const { showLineNumbers } = siteData.markdown;
  if (!registered) {
    registerLanguages();
  }
  const { className, meta } = props;
  const language = className?.replace(/language-/, '');
  if (!language) {
    return <code {...props}></code>;
  }
  let children: string;
  if (typeof props.children === 'string') {
    children = props.children.trim();
  } else if (Array.isArray(props.children)) {
    children = (props.children[0] as string).trim();
  } else {
    children = '';
  }
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

  const copyCode = () => {
    const isCopied = copy(children);
    const el = copyButtonRef.current;

    if (isCopied && el) {
      el.classList.add('copied');
      clearTimeout(timeoutIdMap.get(el));
      const timeoutId = setTimeout(() => {
        el.classList.remove('copied');
        el.blur();
        timeoutIdMap.delete(el);
      }, 2000);
      timeoutIdMap.set(el, timeoutId);
    }
  };

  return (
    <>
      <SyntaxHighlighter
        language={language}
        style={style}
        wrapLines={true}
        className="code"
        customStyle={{ backgroundColor: 'inherit' }}
        // Notice: if the highlight line is specified, the line number must be displayed
        showLineNumbers={showLineNumbers || highlightLines.length > 0}
        lineProps={lineNumber => {
          const isHighlighted = highlightLines.includes(lineNumber);
          return {
            className: isHighlighted ? 'line highlighted' : '',
            style: {
              backgroundColor: isHighlighted
                ? 'var(--modern-code-line-highlight-color)'
                : '',
              display: 'block',
              padding: '0 1.25rem',
            },
          };
        }}
      >
        {children}
      </SyntaxHighlighter>
      <button className="copy" onClick={copyCode} ref={copyButtonRef}></button>
    </>
  );
}
