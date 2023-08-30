import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  OpenInCodeSandboxButton,
  SandpackSetup,
  SandpackFiles,
} from '@codesandbox/sandpack-react';
import { ModernTemplates } from './templates';

export type ModernSandpackProps = {
  template: 'web-app' | 'npm-module';
  customSetup?: SandpackSetup;
  files?: SandpackFiles;
  removeFiles: string[];
  options?: Record<string, any>;
  initialCollapsedFolder?: string[];
};

function fileterFiles(files: SandpackFiles, removeFiles: string[]) {
  if (removeFiles.length === 0) {
    return files;
  }
  const result: SandpackFiles = {};
  Object.keys(files).forEach(filename => {
    if (!removeFiles.includes(filename)) {
      result[filename] = files[filename];
    }
  });
  return result;
}

export default function ModernSandpack(props: ModernSandpackProps) {
  const {
    template,
    customSetup = {},
    files: customFiles = {},
    removeFiles = [],
    options = {},
    initialCollapsedFolder = [],
  } = props;
  const initFiles = ModernTemplates[template];
  const files = {
    ...fileterFiles(initFiles, removeFiles),
    ...fileterFiles(customFiles, removeFiles),
  };
  return (
    <SandpackProvider
      customSetup={{ environment: 'node', ...customSetup }}
      files={files}
      options={{
        activeFile: 'src/routes/page.tsx',
        visibleFiles: [
          'src/routes/page.tsx',
          'src/routes/layout.tsx',
          'src/routes/index.css',
        ],
        ...options,
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer
          initialCollapsedFolder={[
            '/.husky/',
            '/.vscode/',
            '/.codesandbox/',
            ...initialCollapsedFolder,
          ]}
        />
        <SandpackCodeEditor showLineNumbers showInlineErrors showTabs={false} />
        <div style={{ position: 'absolute', right: 0, bottom: 0 }}>
          <OpenInCodeSandboxButton />
        </div>
      </SandpackLayout>
    </SandpackProvider>
  );
}
