import { useEffect, useState } from 'react';
import { LabIcon } from './LabIcon';

export type ProducerSource = {
  label: string;
  file: string;
};

export function ProducerSourceLinks({
  sources,
  resetKey,
}: {
  sources: ProducerSource[];
  resetKey?: string;
}) {
  const [sourceMessage, setSourceMessage] = useState('');
  useEffect(() => {
    setSourceMessage('');
  }, [resetKey]);
  return (
    <div className="lab-control-row" aria-label="Producer source">
      <span>Edit source</span>
      {sources.map(source => {
        const sourceRoot = process.env.MF_LAB_SOURCE_ROOT?.replace(/\/$/, '');
        const editorTarget = sourceRoot
          ? `${sourceRoot}/${source.file}`
          : `../${source.file}`;
        const href =
          process.env.NODE_ENV === 'development'
            ? `/__open-in-editor?file=${encodeURIComponent(editorTarget)}`
            : `vscode://file${sourceRoot}/${source.file}`;
        return (
          <a
            key={source.file}
            href={href}
            title={`${source.label}: ${source.file}`}
            className="lab-source-link"
            onClick={async event => {
              if (process.env.NODE_ENV !== 'development') return;
              event.preventDefault();
              setSourceMessage('');
              try {
                const response = await fetch(href);
                if (!response.ok) throw Error(`HTTP ${response.status}`);
                setSourceMessage(`Requested editor for ${source.file}`);
              } catch {
                setSourceMessage(
                  `Open this file in your editor: ${source.file}`,
                );
              }
            }}
          >
            <LabIcon name="code" />
            {source.file}
          </a>
        );
      })}
      {sourceMessage && <small role="status">{sourceMessage}</small>}
    </div>
  );
}
