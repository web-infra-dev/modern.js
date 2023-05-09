import pug from '@modern-js/builder-shared/pug';
import type { PugOptions } from '@modern-js/builder-shared';
import type { webpack } from '../types';

export default function (
  this: webpack.LoaderContext<PugOptions>,
  source: string,
) {
  const options = {
    filename: this.resourcePath,
    doctype: 'html',
    compileDebug: false,
    ...this.getOptions(),
  };

  const templateCode = pug.compileClient(source, options);
  return `${templateCode}; module.exports = template;`;
}
