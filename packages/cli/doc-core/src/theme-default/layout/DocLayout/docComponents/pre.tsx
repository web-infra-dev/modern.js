import { CodeProps } from './code';

const DEFAULT_LANGUAGE_CLASS = 'language-bash';

export function parseTitleFromMeta(meta: string): string {
  if (!meta) {
    return '';
  }
  let result = meta;
  const highlightReg = /{[\d,-]*}/i;
  const highlightMeta = highlightReg.exec(meta)?.[0];
  if (highlightMeta) {
    result = meta.replace(highlightReg, '').trim();
  }
  result = result.split('=')[1] ?? '';
  return result?.replace(/["'`]/g, '');
}

export function Pre({
  children,
}: {
  children: React.ReactElement[] | React.ReactElement;
}) {
  if (Array.isArray(children)) {
    return <pre>{children}</pre>;
  }

  const { className, meta } = children.props as CodeProps;

  const codeTitle = parseTitleFromMeta(meta);
  return (
    <div className={className || DEFAULT_LANGUAGE_CLASS}>
      {codeTitle && <div className="modern-code-title">{codeTitle}</div>}
      <div className="modern-code-content">{children}</div>
    </div>
  );
}
