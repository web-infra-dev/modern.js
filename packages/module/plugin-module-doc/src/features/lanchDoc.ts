import { join, relative, resolve } from 'path';
import { fs, fastGlob } from '@modern-js/utils';
import { pluginPreview } from '@modern-js/doc-plugin-preview';
import type { UserConfig, Sidebar, SidebarGroup } from '@modern-js/doc-core';
import { pluginApiDocgen } from '@modern-js/doc-plugin-api-docgen';
import type { Options } from '../types';
import { mergeModuleDocConfig } from '../utils';

export async function launchDoc({
  languages,
  appDir,
  doc,
  isProduction,
  previewMode,
  entries,
  apiParseTool,
  parseToolOptions,
}: Required<Options>) {
  const json = JSON.parse(
    fs.readFileSync(resolve(appDir, './package.json'), 'utf8'),
  );
  const root = join(appDir, 'docs');
  const DEFAULT_LANG = languages[0];
  const { dev, build } = await import('@modern-js/doc-core');

  const base = join(root, DEFAULT_LANG);
  const getAutoSidebar = async (): Promise<Sidebar> => {
    const traverse = async (cwd: string): Promise<SidebarGroup['items']> => {
      // FIXME: win32
      const [files, directories] = await Promise.all([
        fastGlob(['*'], {
          cwd,
          onlyFiles: true,
          ignore: ['index.*'],
        }),
        fastGlob(['*'], {
          cwd,
          onlyDirectories: true,
        }),
      ]);

      // files --> string[]
      const fileItems = files.map(file => {
        const link = `/${relative(base, join(cwd, file)).replace(
          /\.[^.]+$/,
          '',
        )}`;
        return link;
      });

      // dir --> SidebarGroup[]
      const directoryItems = await Promise.all(
        directories.map(async (directory: string) => {
          const directoryCwd = join(cwd, directory);
          const hasIndex =
            (
              await fastGlob(['index.*'], {
                cwd: directoryCwd,
                onlyFiles: true,
              })
            ).length > 0;
          const link = `/${relative(base, directoryCwd)}/`;
          const items = await traverse(directoryCwd);
          const text = directory[0].toUpperCase() + directory.slice(1);
          if (hasIndex) {
            return {
              link,
              collapsible: items.length > 0,
              items,
              text,
            };
          } else {
            return {
              collapsible: items.length > 0,
              items,
              text,
            };
          }
        }),
      );

      return [...fileItems, ...directoryItems];
    };
    return {
      '': [
        {
          text: 'Module List',
          link: `/index`,
          collapsible: false,
          items: await traverse(base),
        },
      ],
    };
  };
  const locales =
    languages.length === 2
      ? [
          {
            lang: 'zh',
            label: '简体中文',
          },
          {
            lang: 'en',
            label: 'English',
          },
        ]
      : undefined;
  const modernDocConfig = mergeModuleDocConfig<UserConfig>(
    {
      doc: {
        root,
        title: json.name,
        lang: DEFAULT_LANG,
        globalStyles: join(
          __dirname,
          '..',
          'static',
          'global-styles',
          'index.css',
        ),
        themeConfig: {
          // TODO: support dark mode in code block
          darkMode: false,
          sidebar: await getAutoSidebar(),
          locales,
        },
        markdown: {
          globalComponents: [
            join(
              __dirname,
              '..',
              'static',
              'global-components',
              'Overview.tsx',
            ),
          ],
        },
        head: [
          `
          <script>
            window.MODERN_THEME = 'light';
          </script>
          `,
        ],
        plugins: [
          pluginPreview({ isMobile: previewMode === 'mobile' }),
          pluginApiDocgen({
            entries,
            apiParseTool,
            appDir,
            parseToolOptions,
          }),
        ],
      },
    },
    {
      doc: {
        ...doc,
        base: isProduction ? doc.base : '',
      },
    },
  );

  if (isProduction) {
    await build({
      appDirectory: appDir,
      docDirectory: root,
      config: modernDocConfig,
    });
  } else {
    await dev({
      appDirectory: appDir,
      docDirectory: root,
      config: modernDocConfig,
    });
  }
}
