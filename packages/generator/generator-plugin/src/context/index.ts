import { Schema } from '@modern-js/easy-form-core';
import { PluginInputContext } from './input';

export class PluginContext {
  inputContext: PluginInputContext;

  constructor(inputs: Schema[]) {
    this.inputContext = new PluginInputContext(inputs);
  }
}
