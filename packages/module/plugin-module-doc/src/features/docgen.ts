import path from 'path';
import { chalk } from '@modern-js/utils';
import type { ComponentDoc } from 'react-docgen-typescript';
import { withDefaultConfig } from 'react-docgen-typescript';
import type { ModuleDocgenLanguage, Options } from '../types';
import { PropsMarkdownMap } from '../constants';
import { locales } from '../locales';

export const docgen = async ({
  entries,
  appDir,
  languages,
}: Required<Options>) => {
  console.info('[module-doc-plugin]', 'Start to parse API document...');

  Object.entries(entries).map(async ([key, value]) => {
    const generateDocStr = async (language: ModuleDocgenLanguage) => {
      const moduleSourceFilePath = path.resolve(appDir, value);
      const defaultLang = languages[0];
      const [param] = parse(moduleSourceFilePath);
      const PropsMarkdown = generateTable(param, language);

      if (!PropsMarkdown) {
        console.warn(
          '[module-doc-plugin]',
          `No API document was parsed in ${moduleSourceFilePath}`,
        );
      }

      const suffix = language === defaultLang ? '' : `-${language}`;
      PropsMarkdownMap.set(`${key}${suffix}`, PropsMarkdown);
    };
    await Promise.all(languages.map(lang => generateDocStr(lang)));
  });
  console.info(
    '[module-doc-plugin]',
    `${chalk.black.bgGreen.bold(`Parse API document success!`)}`,
  );
};

const { parse } = withDefaultConfig({
  propFilter: prop =>
    prop.parent == null ||
    prop.parent.fileName.indexOf('node_modules/@types/react') < 0,
});

function generateTable(param: ComponentDoc, language: ModuleDocgenLanguage) {
  const { props } = param;
  const t = locales[language];
  const PROP_TABLE_HEADER = `|${t.property}|${t.description}|${t.type}|${t.defaultValue}|\n|:---:|:---:|:---:|:---:|`;

  const tableContent = Object.keys(props)
    .filter(propName => {
      const { name, description } = props[propName];
      return (
        description ||
        ['className', 'style', 'disabled', 'children'].indexOf(name) > -1
      );
    })
    .map(propName => {
      const { defaultValue, description, name, required, type } =
        props[propName];
      const getType = () =>
        `\`${type.name.replace(/\|/g, '\\|')}\`${
          required ? ` **(${t.required})**` : ''
        }`;
      const getDefaultValue = () => `\`${defaultValue?.value || '-'}\``;

      const getDescription = () => {
        switch (name) {
          case 'className':
            return description || t.className;
          case 'style':
            return description || t.style;
          case 'children':
            return description || t.children;
          case 'disabled':
            return description || t.disabled;
          default:
            return description;
        }
      };

      return `|${name}|${getDescription()}|${getType()}|${getDefaultValue()}|`;
    });

  return `
${param.description ? `\n${param.description}\n` : ''}
${PROP_TABLE_HEADER}
${tableContent.join('\n')}
  `;
}
