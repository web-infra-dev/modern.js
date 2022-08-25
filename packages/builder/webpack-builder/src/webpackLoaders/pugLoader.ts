import pug from '../../compiled/pug';
import loaderUtils from '../../compiled/loader-utils1';

export default function (source) {
  const options = {
    filename: this.resourcePath,
    doctype: 'html',
    ...loaderUtils.getOptions(this),
  };

  const template = pug.compileClient(source, options);

  console.log('template', template);
  return `module.exports = ${template}'`;
}
