import path from 'path';
import type { UserConfig } from '@modern-js/doc-core';
import { fs, fastGlob } from '@modern-js/utils';
import { merge } from '@modern-js/utils/lodash';
import { demoRuntimeModules } from '../runtimeModule';
import { Options, ModuleDocgenLanguage } from '../types';
import { remarkTsxToReact } from '../mdx/code-to-jsx';

export async function launchDoc({
  languages,
  appDir,
  demosDir,
  doc,
  isProduction,
  docgenDir,
  useTemplate,
}: Required<Options>) {
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDir, './package.json'), 'utf8'),
  );
  const root = useTemplate
    ? path.join(appDir, docgenDir)
    : path.join(appDir, demosDir);
  const DEFAULT_LANG = languages[0];
  const { dev, build } = await import('@modern-js/doc-core');
  const getLangPrefixInLink = (language: ModuleDocgenLanguage) =>
    language === DEFAULT_LANG ? '' : `/${language}`;
  const getSidebar = (lang: 'zh' | 'en') => {
    return {
      [getLangPrefixInLink(lang)]: [
        {
          text: lang === 'zh' ? '模块列表' : ' Module List',
          collapsible: false,
          items: [
            ...fastGlob
              .sync('*', {
                cwd: path.join(root, lang),
                onlyFiles: true,
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
  const edenxDocConfig: UserConfig = merge<UserConfig, UserConfig>(
    {
      doc: {
        title: json.name,
        lang: DEFAULT_LANG,
        builderConfig: {
          tools: {
            rspack: {
              plugins: [demoRuntimeModules],
            },
          },
        },
        globalStyles: path.join(__dirname, '../static/index.css'),
        themeConfig: {
          // TODO: support dark mode in code block
          // FIXME: fix close dark mode in doc core
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
    await build(root, edenxDocConfig);
  } else {
    await dev(root, edenxDocConfig);
  }
}
