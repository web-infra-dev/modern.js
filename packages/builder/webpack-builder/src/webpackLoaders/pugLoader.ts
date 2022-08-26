import pug from '../../compiled/pug';
import type { webpack, PugOptions } from '../types';

/* eslint-disable @babel/no-invalid-this */
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
/* eslint-enable @babel/no-invalid-this */
