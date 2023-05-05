import ejs from 'ejs';

export class PluginEjsAPI {
  renderString(template: string, data: Record<string, string>) {
    return ejs.render(template, data) || '';
  }
}
