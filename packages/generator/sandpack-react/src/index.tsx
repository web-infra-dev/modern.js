import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  OpenInCodeSandboxButton,
  SandpackSetup,
  SandpackFiles,
  SandpackThemeProp,
} from '@codesandbox/sandpack-react';
import { ModernTemplates } from './templates';

export type ModernSandpackProps = {
  template: 'web-app' | 'npm-module';
  customSetup?: SandpackSetup;
  files?: SandpackFiles;
  removeFiles?: string[];
  options?: Record<string, any>;
  initialCollapsedFolder?: string[];
  theme?: SandpackThemeProp;
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
    theme = 'light',
  } = props;
  const initFiles = ModernTemplates[template];
  const files = {
    ...fileterFiles(initFiles, removeFiles),
    ...fileterFiles(customFiles, removeFiles),
  };
  return (
    <SandpackProvider
      theme={theme}
      customSetup={{ environment: 'node', ...customSetup }}
      files={files}
      options={{
        activeFile: 'src/routes/page.tsx',
        visibleFiles: Object.keys(customFiles).filter(
          file => !removeFiles.includes(file),
        ),
        ...options,
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer
          autoHiddenFiles
          initialCollapsedFolder={[
            '/.husky/',
            '/.vscode/',
            '/.codesandbox/',
            ...initialCollapsedFolder,
          ]}
        />
        <SandpackCodeEditor
          showLineNumbers
          showInlineErrors
          readOnly={true}
          showTabs={false}
        />
        <div style={{ position: 'absolute', right: '5px', bottom: '5px' }}>
          <OpenInCodeSandboxButton />
        </div>
      </SandpackLayout>
    </SandpackProvider>
  );
}
