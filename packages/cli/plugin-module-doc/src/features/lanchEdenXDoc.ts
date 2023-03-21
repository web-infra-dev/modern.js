import path from 'path';
import type { UserConfig } from '@modern-js/doc-core';
import { fs, fastGlob } from '@modern-js/utils';
import { demoRuntimeModules } from '../runtimeModule';
import { Options, ModuleDocgenLanguage } from '../types';
import { remarkTsxToReact } from '../mdx/code-to-jsx';

export async function launchEdenXDoc({
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
  const edenxDocConfig: UserConfig = {
    doc: {
      title: json.name,
      lang: DEFAULT_LANG,
      builderConfig: {
        dev: {
          port: 3333,
        },
        tools: {
          rspack: {
            plugins: [demoRuntimeModules],
          },
        },
        source: {
          include: [new RegExp(/virtual-demo/)],
        },
      },
      // 全局样式，定制主题颜色
      globalStyles: path.join(__dirname, '../index.css'),
      themeConfig: {
        // 关闭暗黑模式切换按钮
        darkMode: false,
        // 国际化配置
        locales: languages.map(lang => ({
          lang,
          label: lang,
          outlineTitle: lang === 'zh' ? '目录' : 'ON THIS PAGE',
          sidebar: getSidebar(lang),
        })),
      },
      markdown: {
        remarkPlugins: [[remarkTsxToReact, { appDir }]],
      },
      ...doc,
    },
  };

  if (isProduction) {
    await build(root, edenxDocConfig);
  } else {
    await dev(root, edenxDocConfig);
  }
}
