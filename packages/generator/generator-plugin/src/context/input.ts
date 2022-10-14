import { Schema } from '@modern-js/codesmith-formily';
import { isFunction } from '@modern-js/utils/lodash';

export type { Schema };
export class PluginInputContext {
  inputValue: Record<string, unknown> = {}; // 插件输入默认值

  defaultConfig: Record<string, unknown> = {}; // 当前插件增加参数的默认值

  private readonly solutionSchemaFunc: (extra?: Record<string, any>) => Schema;

  private solutionSchema: Record<string, Schema> = {}; // initial input info

  private readonly extendInputMap: Record<
    string,
    {
      before: Record<string, Schema>;
      after: Record<string, Schema>;
    }
  > = {}; // plugin add input

  constructor(solutionSchema: (extra?: Record<string, any>) => Schema) {
    this.solutionSchemaFunc = solutionSchema;
  }

  prepare(inputData: Record<string, unknown>) {
    this.solutionSchema = this.solutionSchemaFunc(inputData).properties!;
  }

  get context() {
    return {
      addInputBefore: this.addInputBefore.bind(this),
      addInputAfter: this.addInputAfter.bind(this),
      setInput: this.setInput.bind(this),
      setInputValue: this.setInputValue.bind(this),
      setDefaultConfig: this.setDefualtConfig.bind(this),
    };
  }

  private validateInputKey(inputKey: string) {
    if (!this.solutionSchema[inputKey]) {
      throw new Error(`the input key ${inputKey} not found`);
    }
  }

  private validateInput(inputKey: string) {
    if (this.solutionSchema[inputKey]) {
      throw new Error(`the input key ${inputKey} already exists`);
    }
    Object.keys(this.extendInputMap).forEach(key => {
      if (
        this.extendInputMap[key].before[inputKey] ||
        this.extendInputMap[key].after[inputKey]
      ) {
        throw new Error(`the input key ${inputKey} is already added`);
      }
    });
  }

  addInputBefore(key: string, input: Schema) {
    this.validateInputKey(key);
    const properties = input.properties || {};
    for (const inputKey of Object.keys(properties)) {
      this.validateInput(inputKey);
      if (this.extendInputMap[key]) {
        this.extendInputMap[key].before[inputKey] = properties[inputKey];
      } else {
        this.extendInputMap[key] = {
          before: { [inputKey]: properties[inputKey] },
          after: {},
        };
      }
    }
  }

  addInputAfter(key: string, input: Schema) {
    this.validateInputKey(key);
    const properties = input.properties || {};
    for (const inputKey of Object.keys(properties)) {
      this.validateInput(inputKey);
      if (this.extendInputMap[key]) {
        this.extendInputMap[key].after[inputKey] = properties[inputKey];
      } else {
        this.extendInputMap[key] = {
          before: {},
          after: { [inputKey]: properties[inputKey] },
        };
      }
    }
  }

  setInput(
    key: string,
    field: string,
    value: unknown | ((input: Schema) => unknown),
  ) {
    const schema = this.solutionSchema[key];
    if (schema) {
      (schema as Record<string, unknown>)[field] = isFunction(value)
        ? value(schema)
        : value;
      return;
    }
    let findFlag = false;
    for (const inputKey of Object.keys(this.extendInputMap)) {
      const beforeSchema = this.extendInputMap[inputKey].before[key];
      if (beforeSchema) {
        findFlag = true;
        (beforeSchema as Record<string, unknown>)[field] = isFunction(value)
          ? value(schema)
          : value;
        break;
      }
      const afterSchema = this.extendInputMap[inputKey].after[key];
      if (afterSchema) {
        findFlag = true;
        (afterSchema as Record<string, unknown>)[field] = isFunction(value)
          ? value(schema)
          : value;
        break;
      }
    }
    if (!findFlag) {
      throw new Error(`the input ${key} not found`);
    }
  }

  getFinalInputs(): Record<string, Schema> {
    const result: Record<string, Schema> = {};
    Object.keys(this.solutionSchema).forEach(key => {
      const { before, after } = this.extendInputMap[key] || {
        before: {},
        after: {},
      };
      Object.keys(before).forEach(
        beforeKey => (result[beforeKey] = before[beforeKey]),
      );
      result[key] = this.solutionSchema[key];
      Object.keys(after).forEach(
        afterKey => (result[afterKey] = after[afterKey]),
      );
    });
    return result;
  }

  setInputValue(value: Record<string, unknown>) {
    this.inputValue = value;
  }

  setDefualtConfig(value: Record<string, unknown>) {
    this.defaultConfig = value;
  }
}
