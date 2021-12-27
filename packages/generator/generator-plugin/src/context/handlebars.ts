import * as handlebars from 'handlebars';

export class PluginHandlebarsAPI {
  helpers: Record<string, handlebars.HelperDelegate> = {};

  partials: Record<string, handlebars.Template> = {};

  renderString(template: string, data: Record<string, string>) {
    const helpers: Record<string, handlebars.HelperDelegate> = {
      ...this.helpers,
    };
    const partials: Record<string, handlebars.Template> = {
      ...this.partials,
    };
    Object.keys(helpers).forEach(h => handlebars.registerHelper(h, helpers[h]));
    Object.keys(partials).forEach(p =>
      handlebars.registerPartial(p, partials[p]),
    );
    return handlebars.compile(template)(data) || '';
  }

  addHelper(name: string, fn: handlebars.HelperDelegate) {
    this.helpers[name] = fn;
  }

  addPartial(name: string, str: handlebars.Template) {
    this.partials[name] = str;
  }

  get method() {
    return {
      setHelper: this.addHelper.bind(this),
      setPartial: this.addPartial.bind(this),
    };
  }
}
