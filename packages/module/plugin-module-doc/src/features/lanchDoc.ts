import path from 'path';
import { fs, fastGlob } from '@modern-js/utils';
import { demoRuntimeModules } from '../runtimeModule';
import { Options, ModuleDocgenLanguage } from '../types';
import { remarkTsxToReact } from '../mdx/code-to-jsx';

export async function launchDoc({
  languages,
  appDir,
  doc,
  isProduction,
}: Required<Options>) {
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDir, './package.json'), 'utf8'),
  );
  const root = path.join(appDir, 'docs');
  const DEFAULT_LANG = languages[0];
  const { dev, build, mergeDocConfig } = await import('@modern-js/doc-core');
  const getLangPrefixInLink = (language: ModuleDocgenLanguage) =>
    language === DEFAULT_LANG ? '' : `/${language}`;
  const getSidebar = (lang: 'zh' | 'en') => {
    return {
      [getLangPrefixInLink(lang)]: [
        {
          text: lang === 'zh' ? '组件' : ' Component',
          link: `${getLangPrefixInLink(lang)}/index`,
          collapsible: false,
          items: [
            ...fastGlob
              .sync('*', {
                cwd: path.join(root, lang),
                onlyFiles: true,
                ignore: ['index.*'],
              })
              .map(filename => {
                const key = path.parse(filename).name;
                return {
                  text: key,
                  link: `${getLangPrefixInLink(lang)}/${key}`,
                };
              }),
          ],
        },
      ],
    };
  };
  const modernDocConfig = mergeDocConfig(
    {
      doc: {
        root,
        title: json.name,
        lang: DEFAULT_LANG,
        builderConfig: {
          tools: {
            rspack: {
              plugins: [demoRuntimeModules],
              watchOptions: {
                ignored: ['**/virtual-demo*.tsx'],
              },
            },
          },
        },
        globalStyles: path.join(__dirname, '../static/index.css'),
        themeConfig: {
          // TODO: support dark mode in code block
          darkMode: false,
          locales: languages.map(lang => ({
            lang,
            label: lang === 'zh' ? '简体中文' : 'English',
            outlineTitle: lang === 'zh' ? '目录' : 'ON THIS PAGE',
            sidebar: getSidebar(lang),
          })),
        },
        markdown: {
          remarkPlugins: [
            [remarkTsxToReact, { appDir, defaultLang: DEFAULT_LANG }],
          ],
        },
        head: [
          `
          <script>
            window.MODERN_THEME = 'light';
          </script>
          `,
        ],
      },
    },
    {
      doc: {
        ...doc,
        // TODO: doc base should only be set in production mode
        base: isProduction ? doc.base : '',
      },
    },
  );

  if (isProduction) {
    await build(root, modernDocConfig);
  } else {
    await dev(root, modernDocConfig);
  }
}
