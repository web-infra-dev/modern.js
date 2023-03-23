import path from 'path';
import { fs, chalk, fastGlob } from '@modern-js/utils';
import type { APIParseTools, ModuleDocgenLanguage, Options } from '../../types';
// import frontMatter from 'front-matter';
import { PropsMarkdownMap } from '../../constants';
import getProps from './getProps';
import injectDemoCodes from './injectDemoCodes';

const PLACEHOLDER_TITLE = '%%Title%%';
const PLACEHOLDER_PROP = '%%Props%%';
const PLACEHOLDER_DEMO = '%%Demos%%';
const TEMPLATE_MARKDOWN_BODY =
  '# %%Title%%\n\n## Demos\n\n%%Demos%%\n\n## 属性/Props\n\n%%Props%%\n';
const DEFAULT_DEMO_GLOB = './index.js';

export const docgen = async ({
  entries,
  appDir,
  tsParseTool,
  languages,
  docgenDir,
  demosDir,
  useTemplate,
}: Required<Options>) => {
  console.info('[module-doc-plugin]', 'Start to generate document...');

  Object.entries(entries).map(async ([key, value]) => {
    const generateDocStr = async (
      language: ModuleDocgenLanguage,
      tsParseTool: APIParseTools,
    ) => {
      const demoDir = path.resolve(demosDir, key);
      const moduleName = path.parse(demoDir).name;
      const outputPath = path.resolve(docgenDir, language, `${key}.mdx`);
      const moduleSourceFilePath = path.resolve(appDir, value);
      const defaultLang = languages[0];
      // TODO: 增加用户可自定义模版，如没有定义模版则使用默认模版
      // const fmResult = frontMatter<Record<string, any>>(fs.readFileSync(templatePath, 'utf8'));
      // const attributes = fmResult.attributes;
      const attributes = { file: moduleName };
      // let markdownBody = fmResult.body;

      // Inject Props doc
      const PropsMarkdown = getProps(
        tsParseTool,
        {},
        {
          moduleSourceFilePath,
          attributes,
          language,
        },
      );
      if (!useTemplate) {
        const suffix = language === defaultLang ? '' : `-${language}`;
        PropsMarkdownMap.set(`${key}${suffix}`, PropsMarkdown);
        return;
      }

      let markdownBody = TEMPLATE_MARKDOWN_BODY;

      markdownBody = markdownBody.replace(PLACEHOLDER_PROP, PropsMarkdown);

      // Inject Demos
      const demoEntries = await fastGlob(
        path.resolve(demoDir, DEFAULT_DEMO_GLOB),
      );
      markdownBody = injectDemoCodes({
        demoEntries,
        markdownBody,
        placeholder: PLACEHOLDER_DEMO,
      });
      // Inject Title, or the search won't work
      markdownBody = markdownBody.replace(PLACEHOLDER_TITLE, moduleName);
      await fs.outputFile(outputPath, markdownBody);
    };
    await Promise.all(languages.map(v => generateDocStr(v, tsParseTool)));

    console.info(
      '[module-doc-plugin]',
      `${chalk.black.bgGreen.bold(
        `Generate API for ${path.relative(appDir, demosDir)} Success!`,
      )}`,
    );
  });
};
