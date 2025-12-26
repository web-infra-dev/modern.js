import { Tab, Tabs } from '@rspress/core/theme';
import React, {
  type PropsWithChildren,
  useMemo,
  cloneElement,
  useRef,
  useEffect,
} from 'react';

/**
 * Framework transformation configuration
 */
export interface FrameworkTransform {
  /** Framework identifier (used as Tab value) */
  id: string;
  /** Framework display name (used as Tab label) */
  label: string;
  /** Target import path */
  importPath: string;
  /** Code transformation function that receives original code and returns transformed code */
  transform?: (code: string) => string;
}

/**
 * FrameworkCode component for displaying code examples that support multiple runtime frameworks
 *
 * - Single framework: Renders transformed code directly without Tabs
 * - Multiple frameworks: Displays multiple framework versions using Tabs
 *
 * The component automatically replaces the source import path with each framework's target import path.
 * The code in the document should use the sourcePath, which will be replaced with each framework's importPath.
 */
interface FrameworkCodeProps {
  /** Framework configuration list (optional, if empty and defaultImportPath is provided, will use it for replacement) */
  frameworks?: FrameworkTransform[];
  /** Default selected framework ID (only effective when multiple frameworks are provided) */
  defaultTab?: string;
  /** Source import path used in the document code (will be replaced with each framework's importPath) */
  sourcePath: string;
  /** Default import path to use when frameworks array is empty (optional) */
  defaultImportPath?: string;
}

const FrameworkCode: React.FC<PropsWithChildren<FrameworkCodeProps>> = ({
  children,
  frameworks,
  defaultTab,
  sourcePath,
  defaultImportPath,
}) => {
  /**
   * Replace source import path with target framework import path
   * Only replaces import/export statements, avoiding comments and string literals
   */
  const replaceImportPath = (
    code: string,
    source: string,
    target: string,
  ): string => {
    // Escape special regex characters in source path
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match import/export statements with the source path
    // Supports:
    // - import ... from 'source'
    // - import type ... from 'source'
    // - import ... from "source"
    // - export ... from 'source'
    // - export type ... from 'source'
    // Uses a more precise regex that matches the full import/export statement
    const importExportRegex = new RegExp(
      `(import\\s+(?:type\\s+)?[^'"]*from\\s+|export\\s+(?:type\\s+)?[^'"]*from\\s+)(['"\`])${escapedSource}(['"\`])`,
      'g',
    );

    return code.replace(importExportRegex, `$1$2${target}$3`);
  };

  /**
   * Component wrapper that clones ShikiPre and replaces import paths in the code
   * This preserves shiki's syntax highlighting structure by only replacing the import path string
   * in text nodes, without modifying the HTML structure
   */
  const ShikiPreWithCode: React.FC<{
    originalElement: React.ReactElement;
    newCode: string;
    originalCode: string;
    sourcePath: string;
    targetPath: string;
  }> = ({ originalElement, newCode, originalCode, sourcePath, targetPath }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (containerRef.current) {
        // Find the pre element inside
        const preElement = containerRef.current.querySelector('pre');
        if (preElement) {
          // Get the code element (usually inside pre)
          const codeElement = preElement.querySelector('code') || preElement;

          // Escape special regex characters in source path
          const escapedSource = sourcePath.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          );
          const regex = new RegExp(escapedSource, 'g');

          // Replace import paths in all text nodes, preserving the HTML structure
          const walker = document.createTreeWalker(
            codeElement,
            NodeFilter.SHOW_TEXT,
            null,
          );

          let node;
          while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              const originalText = node.textContent;
              // Only replace if the text contains the source path
              if (originalText.includes(sourcePath)) {
                node.textContent = originalText.replace(regex, targetPath);
              }
            }
          }
        }
      }
    }, [sourcePath, targetPath]);

    return <div ref={containerRef}>{cloneElement(originalElement)}</div>;
  };
  const parseCodeBlocks = (
    children: React.ReactNode,
  ): Array<{
    meta: string;
    code: string;
    language: string;
    title?: string;
    originalElement?: React.ReactElement; // Save original ShikiPre element
  }> => {
    const blocks: Array<{
      meta: string;
      code: string;
      language: string;
      title?: string;
      originalElement?: React.ReactElement;
    }> = [];

    const traverse = (node: any, depth = 0): void => {
      if (!node) return;

      // Handle Fragment (React.Fragment or <>...</>)
      if (
        node.type === React.Fragment ||
        (typeof node.type === 'symbol' &&
          node.type.toString().includes('Fragment'))
      ) {
        if (node.props?.children) {
          React.Children.forEach(node.props.children, child =>
            traverse(child, depth + 1),
          );
        }
        return;
      }

      // Handle pre > code structure (rspress parsed code blocks)
      if (node.props) {
        // Check if this is ShikiPre component (rspress code block component)
        const nodeType = node.type;
        const isShikiPre =
          (typeof nodeType === 'function' && nodeType.name === 'ShikiPre') ||
          (node.props?.className === 'shiki css-variables' && node.props?.lang);

        // Check if this is a <pre> element containing <code>
        const isPre =
          nodeType === 'pre' ||
          (typeof nodeType === 'string' && nodeType === 'pre') ||
          nodeType?.displayName === 'pre' ||
          (typeof nodeType === 'function' && nodeType.name === 'pre');

        // Handle ShikiPre component (rspress code blocks)
        if (isShikiPre) {
          const lang = node.props.lang || 'ts';
          const title = node.props.title;

          // Extract code content from children
          let codeContent = '';
          const children = node.props.children;

          if (children) {
            // ShikiPre's children is usually a <pre> element
            if (typeof children === 'object' && children.props) {
              // Try to get code from pre element's children
              const preChildren = children.props.children;

              // Recursive function to extract text from React elements
              const extractText = (node: any): string => {
                if (typeof node === 'string') {
                  return node;
                }
                if (Array.isArray(node)) {
                  return node.map(extractText).join('');
                }
                if (node?.props?.children) {
                  return extractText(node.props.children);
                }
                return '';
              };

              codeContent = extractText(preChildren);
            } else if (typeof children === 'string') {
              codeContent = children;
            }
          }

          if (codeContent.trim()) {
            blocks.push({
              meta: title ? `title="${title}"` : '',
              code: codeContent,
              language: lang,
              title,
              originalElement: node, // Save original ShikiPre element
            });
            return;
          }
        }

        // Also check for code elements directly (might be wrapped differently)
        const isCode =
          nodeType === 'code' ||
          (typeof nodeType === 'string' && nodeType === 'code') ||
          nodeType?.displayName === 'code' ||
          (typeof nodeType === 'function' && nodeType.name === 'code') ||
          node.props?.className?.includes('language-');

        if (isPre && node.props.children) {
          const codeElement = React.Children.toArray(node.props.children).find(
            (child: any) => {
              const childType = child?.type;
              return (
                childType === 'code' ||
                (typeof childType === 'string' && childType === 'code') ||
                child?.props?.className?.includes('language-')
              );
            },
          ) as any;

          if (codeElement) {
            let codeContent = '';

            if (typeof codeElement === 'string') {
              codeContent = codeElement;
            } else {
              const children =
                codeElement.props?.children || codeElement.children;
              if (typeof children === 'string') {
                codeContent = children;
              } else if (Array.isArray(children)) {
                codeContent = children
                  .map((c: any) =>
                    typeof c === 'string' ? c : c?.props?.children || '',
                  )
                  .join('');
              } else if (children != null) {
                codeContent = String(children);
              }
            }

            // Extract language from className (e.g., "language-ts" -> "ts")
            const className = codeElement.props?.className || '';
            const languageMatch = className.match(/language-(\w+)/);
            const language = languageMatch?.[1] || 'ts';

            // Extract title from meta or data-title attribute
            const meta =
              codeElement.props?.meta || codeElement.props?.['data-meta'] || '';
            const titleMatch = meta.match(/title="([^"]+)"/);
            const title = titleMatch?.[1] || codeElement.props?.['data-title'];

            if (codeContent) {
              blocks.push({
                meta,
                code: codeContent,
                language,
                title,
              });
            }
            return;
          }
        }

        // Handle direct code element with className containing language- (rspress structure)
        if (isCode && !isPre && node.props?.className?.includes('language-')) {
          let codeContent = '';
          const children = node.props?.children;

          if (typeof children === 'string') {
            codeContent = children;
          } else if (Array.isArray(children)) {
            codeContent = children
              .map((c: any) =>
                typeof c === 'string' ? c : c?.props?.children || '',
              )
              .join('');
          } else if (children != null) {
            codeContent = String(children);
          }

          if (codeContent) {
            const className = node.props.className || '';
            const languageMatch = className.match(/language-(\w+)/);
            const language = languageMatch?.[1] || 'ts';
            const meta = node.props?.meta || '';
            const titleMatch = meta.match(/title="([^"]+)"/);
            const title = titleMatch?.[1] || node.props?.['data-title'];

            blocks.push({
              meta,
              code: codeContent,
              language,
              title,
            });
            return;
          }
        }

        // Handle direct code element with meta prop (alternative MDX structure)
        if (node.props.meta && node.props.children) {
          const metaMatch = node.props.meta.match(
            /(\w+)(?:\s+title="([^"]+)")?/,
          );
          const language = metaMatch?.[1] || 'ts';
          const title = metaMatch?.[2];
          const codeContent = node.props.children;

          if (codeContent) {
            blocks.push({
              meta: node.props.meta,
              code:
                typeof codeContent === 'string'
                  ? codeContent
                  : String(codeContent),
              language,
              title,
            });
            return;
          }
        }

        // Generic check: any element with language- className (rspress might use custom components)
        if (
          node.props?.className &&
          typeof node.props.className === 'string' &&
          node.props.className.includes('language-')
        ) {
          let codeContent = '';
          const children = node.props?.children;

          if (typeof children === 'string') {
            codeContent = children;
          } else if (Array.isArray(children)) {
            codeContent = children
              .map((c: any) => {
                if (typeof c === 'string') return c;
                // Try to extract text from nested elements
                if (c?.props?.children) {
                  return typeof c.props.children === 'string'
                    ? c.props.children
                    : String(c.props.children);
                }
                return '';
              })
              .join('');
          } else if (children != null) {
            codeContent = String(children);
          }

          if (codeContent.trim()) {
            const className = node.props.className;
            const languageMatch = className.match(/language-(\w+)/);
            const language = languageMatch?.[1] || 'ts';
            const meta = node.props?.meta || '';
            const titleMatch = meta.match(/title="([^"]+)"/);
            const title = titleMatch?.[1] || node.props?.['data-title'];

            blocks.push({
              meta,
              code: codeContent,
              language,
              title,
            });
            return; // Don't traverse children if we found a code block
          }
        }

        // Recursively traverse children
        if (node.props.children) {
          React.Children.forEach(node.props.children, child =>
            traverse(child, depth + 1),
          );
        }
      }
    };

    // First, try to extract code blocks from children
    React.Children.forEach(children, traverse);

    return blocks;
  };

  const codeBlocks = useMemo(() => parseCodeBlocks(children), [children]);

  // If no code blocks, return children as-is
  if (codeBlocks.length === 0) {
    return <>{children}</>;
  }

  // If frameworks is empty but defaultImportPath is provided, use it for replacement
  if (!frameworks || frameworks.length === 0) {
    if (defaultImportPath) {
      return (
        <>
          {codeBlocks.map((block, index) => {
            const transformedCode = replaceImportPath(
              block.code,
              sourcePath,
              defaultImportPath,
            );

            return (
              <pre key={block.title || block.meta || `block-${index}`}>
                <code className={`language-${block.language}`}>
                  {transformedCode}
                </code>
              </pre>
            );
          })}
        </>
      );
    }
    return <>{children}</>;
  }

  // Single framework: render transformed code directly without Tabs
  if (frameworks.length === 1) {
    const framework = frameworks[0];
    return (
      <>
        {codeBlocks.map((block, index) => {
          // First replace source import path with framework's import path, then apply custom transform
          let transformedCode = replaceImportPath(
            block.code,
            sourcePath,
            framework.importPath,
          );
          if (framework.transform) {
            transformedCode = framework.transform(transformedCode);
          }

          // If we have the original ShikiPre element, clone it with new code
          if (block.originalElement) {
            return (
              <ShikiPreWithCode
                key={block.title || block.meta || `block-${index}`}
                originalElement={block.originalElement}
                newCode={transformedCode}
                originalCode={block.code}
                sourcePath={sourcePath}
                targetPath={framework.importPath}
              />
            );
          }

          // Fallback to simple pre/code if no original element
          return (
            <pre key={block.title || block.meta || `block-${index}`}>
              <code className={`language-${block.language}`}>
                {transformedCode}
              </code>
            </pre>
          );
        })}
      </>
    );
  }

  // Multiple frameworks: display using Tabs
  // Try both formats: string array (labels) and object array
  const defaultFrameworkId = defaultTab || frameworks[0]?.id || '';
  const defaultFrameworkLabel =
    frameworks.find(f => f.id === defaultFrameworkId)?.label ||
    frameworks[0]?.label ||
    '';
  const frameworkValues = frameworks.map(f => f.label);

  if (codeBlocks.length === 1) {
    const block = codeBlocks[0];

    return (
      <div>
        <Tabs
          defaultValue={defaultFrameworkLabel}
          values={frameworkValues}
          {...({} as any)}
        >
          {frameworks.map(framework => {
            // First replace source import path with framework's import path, then apply custom transform
            let transformedCode = replaceImportPath(
              block.code,
              sourcePath,
              framework.importPath,
            );
            if (framework.transform) {
              transformedCode = framework.transform(transformedCode);
            }

            // If we have the original ShikiPre element, clone it with new code
            const codeElement = block.originalElement ? (
              <ShikiPreWithCode
                originalElement={block.originalElement}
                newCode={transformedCode}
                originalCode={block.code}
                sourcePath={sourcePath}
                targetPath={framework.importPath}
              />
            ) : (
              <pre>
                <code className={`language-${block.language}`}>
                  {transformedCode}
                </code>
              </pre>
            );

            return (
              <Tab
                key={framework.id}
                value={framework.label}
                label={framework.label}
                {...({} as any)}
              >
                {codeElement}
              </Tab>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // Multiple code blocks: generate multiple framework versions for each block
  return (
    <>
      {codeBlocks.map((block, blockIndex) => (
        <div key={block.title || block.meta || `tabs-${blockIndex}`}>
          <Tabs
            defaultValue={defaultFrameworkLabel}
            values={frameworkValues}
            {...({} as any)}
          >
            {frameworks.map(framework => {
              // First replace source import path with framework's import path, then apply custom transform
              let transformedCode = replaceImportPath(
                block.code,
                sourcePath,
                framework.importPath,
              );
              if (framework.transform) {
                transformedCode = framework.transform(transformedCode);
              }

              // If we have the original ShikiPre element, clone it with new code
              const codeElement = block.originalElement ? (
                <ShikiPreWithCode
                  originalElement={block.originalElement}
                  newCode={transformedCode}
                  originalCode={block.code}
                  sourcePath={sourcePath}
                  targetPath={framework.importPath}
                />
              ) : (
                <pre>
                  <code className={`language-${block.language}`}>
                    {transformedCode}
                  </code>
                </pre>
              );

              return (
                <Tab
                  key={framework.id}
                  value={framework.label}
                  label={framework.label}
                  {...({} as any)}
                >
                  {codeElement}
                </Tab>
              );
            })}
          </Tabs>
        </div>
      ))}
    </>
  );
};

export default FrameworkCode;
