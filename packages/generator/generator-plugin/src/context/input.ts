/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable max-lines */
import { Schema, SchemaValidateType } from '@modern-js/easy-form-core';
import { isFunction } from '@modern-js/utils/lodash';

export enum InputType {
  Input = 'input',
  Radio = 'radio',
  Checkbox = 'checkbox',
}

export interface IOption {
  key: string;
  name: string | (() => string);
  isDefault?: boolean;
  when?: (
    input: Record<string, unknown>,
    extra?: Record<string, unknown>,
  ) => boolean;
}

export interface IInput {
  key: string;
  name: string | (() => string);
  type: InputType;
  options?: IOption[];
  when?: (
    input: Record<string, unknown>,
    extra?: Record<string, unknown>,
  ) => boolean;
  validate?: SchemaValidateType;
}
export class PluginInputContext {
  inputValue: Record<string, unknown> = {};

  private readonly inputs: Schema[] = []; // initial input info

  private readonly extendInputMap: Record<
    string,
    {
      before: IInput[];
      after: IInput[];
    }
  > = {}; // plugin add input

  private readonly extendOptionMap: Record<
    string,
    Record<string, { before: IOption[]; after: IOption[] }>
  > = {}; // plugin add option

  constructor(inputs: Schema[]) {
    this.inputs = inputs;
  }

  get context() {
    return {
      addInputBefore: this.addInputBefore.bind(this),
      addInputAfter: this.addInputAfter.bind(this),
      setInput: this.setInput.bind(this),
      addOptionBefore: this.addOptionBefore.bind(this),
      addOptionAfter: this.addOptionAfter.bind(this),
      setInputValue: this.setInputValue.bind(this),
    };
  }

  private validateInputKey(inputKey: string) {
    if (!this.inputs.find(item => item.key === inputKey)) {
      throw new Error(`the input key ${inputKey} not found`);
    }
  }

  private validateInput(input: IInput) {
    if (this.inputs.find(item => item.key === input.key)) {
      throw new Error(`the input key ${input.key} already exists`);
    }
    Object.keys(this.extendInputMap).forEach(key => {
      if (
        this.extendInputMap[key].before.find(item => item.key === input.key) ||
        this.extendInputMap[key].after.find(item => item.key === input.key)
      ) {
        throw new Error(`the input key ${input.key} is already added`);
      }
    });
  }

  private validateOption(key: string, option: IOption) {
    const input = this.inputs.find(item => item.key === key);
    if (
      input &&
      (input.items as Schema[])?.find(item => item.key === option.key)
    ) {
      throw new Error(`the option key ${option.key} already exists`);
    }
    Object.keys(this.extendInputMap).forEach(inputKey => {
      const beforeInput = this.extendInputMap[inputKey].before.find(
        item => item.key === key,
      );
      const afterInput = this.extendInputMap[inputKey].after.find(
        item => item.key === key,
      );
      if (
        (beforeInput &&
          (beforeInput.options as IOption[])?.find(
            item => item.key === option.key,
          )) ||
        (afterInput &&
          (afterInput.options as IOption[])?.find(
            item => item.key === option.key,
          ))
      ) {
        throw new Error(`the option key ${option.key} is already added`);
      }
    });
  }

  private validateOptionKey(key: string, optionKey: string) {
    const input = this.inputs.find(item => item.key === key);
    if (
      input &&
      !(input.items as Schema[])?.find(item => item.key === optionKey)
    ) {
      throw new Error(`the option key ${optionKey} is not found`);
    }
    let foundFlag = false;
    Object.keys(this.extendInputMap).forEach(inputKey => {
      const beforeInput = this.extendInputMap[inputKey].before.find(
        item => item.key === key,
      );
      const afterInput = this.extendInputMap[inputKey].after.find(
        item => item.key === key,
      );
      if (beforeInput || afterInput) {
        foundFlag = true;
      }
      if (
        (beforeInput &&
          !(beforeInput.options as IOption[])?.find(
            item => item.key === optionKey,
          )) ||
        (afterInput &&
          !(afterInput.options as IOption[])?.find(
            item => item.key === optionKey,
          ))
      ) {
        throw new Error(`the option key ${optionKey} is not found`);
      }
    });
    if (!input && !foundFlag) {
      throw new Error(`the input key ${key} is not found`);
    }
  }

  addInputBefore(key: string, input: IInput) {
    this.validateInputKey(key);
    this.validateInput(input);
    if (this.extendInputMap[key]) {
      this.extendInputMap[key].before.push(input);
    } else {
      this.extendInputMap[key] = {
        before: [input],
        after: [],
      };
    }
  }

  addInputAfter(key: string, input: IInput) {
    this.validateInputKey(key);
    this.validateInput(input);
    if (this.extendInputMap[key]) {
      this.extendInputMap[key].after.push(input);
    } else {
      this.extendInputMap[key] = {
        before: [],
        after: [input],
      };
    }
  }

  setInput(
    key: string,
    field: string,
    value: unknown | ((input: IInput) => unknown),
  ) {
    const index = this.inputs.findIndex(item => item.key === key);
    if (index !== -1) {
      const originInput = this.transformSchema(this.inputs[index]);
      const input = this.getFinalInput(originInput);
      const targetValue = isFunction(value) ? value(input) : value;
      this.inputs[index] = this.transformInput({
        ...originInput,
        [field]: targetValue,
      });
      if (field === 'options') {
        this.resetExtendOptionMap(key);
      }
      return;
    }
    let findFlag = false;
    for (const inputKey of Object.keys(this.extendInputMap)) {
      const beforeIndex = this.extendInputMap[inputKey].before.findIndex(
        item => item.key === key,
      );
      const afterIndex = this.extendInputMap[inputKey].after.findIndex(
        item => item.key === key,
      );
      if (beforeIndex !== -1) {
        findFlag = true;
        const originBeforeInput =
          this.extendInputMap[inputKey].before[beforeIndex];
        const input = this.getFinalInput(originBeforeInput);
        const targetValue = isFunction(value) ? value(input) : value;
        this.extendInputMap[inputKey].before[beforeIndex] = {
          ...originBeforeInput,
          [field]: targetValue,
        };
        if (field === 'options') {
          this.resetExtendOptionMap(key);
        }
        break;
      }
      if (afterIndex !== -1) {
        findFlag = true;
        const originAfterInput =
          this.extendInputMap[inputKey].after[afterIndex];
        const input = this.getFinalInput(originAfterInput);
        const targetValue = isFunction(value) ? value(input) : value;
        this.extendInputMap[inputKey].after[afterIndex] = {
          ...originAfterInput,
          [field]: targetValue,
        };
        if (field === 'options') {
          this.resetExtendOptionMap(key);
        }
        break;
      }
    }
    if (!findFlag) {
      throw new Error(`the input ${key} not found`);
    }
  }

  private transformInput(input: IInput): Schema {
    const valueOption = input.options?.find(option => option.isDefault);
    return {
      key: input.key,
      label: input.name,
      type: ['string'],
      mutualExclusion: input.type === InputType.Radio,
      coexit: input.type === InputType.Checkbox,
      items: input.options?.map(option => ({
        key: option.key,
        label: option.name,
        when: option.when,
      })),
      when: input.when,
      state: {
        value: valueOption ? valueOption.key : undefined,
      },
      validate: input.validate,
    };
  }

  private transformSchema(schema: Schema): IInput {
    return {
      key: schema.key,
      name: schema.label as string | (() => string),
      // eslint-disable-next-line no-nested-ternary
      type: schema.mutualExclusion
        ? InputType.Radio
        : schema.coexit
        ? InputType.Checkbox
        : InputType.Input,
      options: (schema.items as Schema[])?.map(item => ({
        key: item.key,
        name: item.label as string | (() => string),
        isDefault: item.key === schema.state?.value,
      })),
      when: schema.when,
      validate: schema.validate as any,
    };
  }

  private getFinalInput(input: IInput): IInput {
    const extendOption = this.extendOptionMap[input.key];
    if (extendOption) {
      const result: IOption[] = [];
      input.options?.forEach(option => {
        const { before, after } = extendOption[option.key] || {
          before: [],
          after: [],
        };
        before.forEach(item => result.push(item));
        result.push(option);
        after.forEach(item => result.push(item));
        // option state has already set in input
        this.extendOptionMap[input.key][option.key] = {
          before: [],
          after: [],
        };
      });
      input.options = result;
    }
    return input;
  }

  getFinalInputs() {
    const result: Schema[] = [];
    this.inputs.forEach(input => {
      const { before, after } = this.extendInputMap[input.key] || {
        before: [],
        after: [],
      };
      before.forEach(item =>
        result.push(this.transformInput(this.getFinalInput(item))),
      );
      result.push(
        this.transformInput(this.getFinalInput(this.transformSchema(input))),
      );
      after.forEach(item =>
        result.push(this.transformInput(this.getFinalInput(item))),
      );
    });
    return result;
  }

  private initExtendOptionMap(key: string, optionKey: string) {
    this.extendOptionMap[key] = this.extendOptionMap[key] || {
      [key]: {
        [optionKey]: {
          before: [],
          after: [],
        },
      },
    };
    this.extendOptionMap[key][optionKey] = this.extendOptionMap[key][
      optionKey
    ] || {
      before: [],
      after: [],
    };
  }

  private resetExtendOptionMap(key: string) {
    this.extendOptionMap[key] = {};
  }

  addOptionBefore(key: string, optionKey: string, option: IOption) {
    this.validateOptionKey(key, optionKey);
    this.validateOption(key, option);
    this.initExtendOptionMap(key, optionKey);
    this.extendOptionMap[key][optionKey].before.push(option);
  }

  addOptionAfter(key: string, optionKey: string, option: IOption) {
    this.validateOptionKey(key, optionKey);
    this.validateOption(key, option);
    this.initExtendOptionMap(key, optionKey);
    this.extendOptionMap[key][optionKey].after.push(option);
  }

  setInputValue(value: Record<string, unknown>) {
    this.inputValue = value;
  }
}
