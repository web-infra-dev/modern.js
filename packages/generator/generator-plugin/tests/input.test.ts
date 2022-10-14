import { isObject } from '@modern-js/utils/lodash';
import { Schema, PluginInputContext } from '../src/context/input';

describe('PluginInputContext Test', () => {
  test('Add Input', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        input1: {
          type: 'string',
          title: 'input1',
        },
        input2: {
          type: 'string',
          title: 'input2',
        },
      },
    };
    const inputContext = new PluginInputContext(() => schema);
    inputContext.prepare({});

    inputContext.addInputBefore('input2', {
      type: 'object',
      properties: {
        'input1.2': {
          type: 'string',
          title: 'input1.2',
        },
      },
    });

    inputContext.addInputAfter('input1', {
      type: 'object',
      properties: {
        'input1.1': {
          type: 'string',
          title: 'input1.1',
        },
      },
    });

    const finalInputs = inputContext.getFinalInputs();

    expect(Object.keys(finalInputs).length).toBe(4);
    expect(Object.keys(finalInputs)).toEqual([
      'input1',
      'input1.1',
      'input1.2',
      'input2',
    ]);
  });
  test('Add Input Error', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        input1: {
          type: 'string',
          title: 'input1',
        },
        input2: {
          type: 'string',
          title: 'input2',
        },
      },
    };
    const inputContext = new PluginInputContext(() => schema);
    inputContext.prepare({});

    expect(() =>
      inputContext.addInputBefore('input3', {
        type: 'object',
        properties: {
          'input1.1': {
            type: 'string',
            title: 'input1.1',
          },
        },
      }),
    ).toThrow('the input key input3 not found');

    expect(() =>
      inputContext.addInputBefore('input2', {
        type: 'object',
        properties: {
          input1: {
            type: 'string',
            title: 'input1',
          },
        },
      }),
    ).toThrow('the input key input1 already exists');

    inputContext.addInputAfter('input1', {
      type: 'object',
      properties: {
        'input1.1': {
          type: 'string',
          title: 'input1.1',
        },
      },
    });

    expect(() =>
      inputContext.addInputAfter('input1', {
        type: 'object',
        properties: {
          'input1.1': {
            type: 'string',
            title: 'input1.1',
          },
        },
      }),
    ).toThrow('the input key input1.1 is already added');
  });
  test('Set Input', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        input1: {
          type: 'string',
          title: 'input1',
          enum: [
            {
              value: 'option1',
              label: 'options1',
            },
            {
              value: 'options2',
              label: 'option2',
            },
          ],
        },
        input2: {
          type: 'string',
          title: 'input2',
        },
      },
    };
    const inputContext = new PluginInputContext(() => schema);
    inputContext.prepare({});

    inputContext.setInput('input1', 'title', '输入选项一');

    expect(inputContext.getFinalInputs().input1.title).toBe('输入选项一');

    inputContext.setInput('input1', 'enum', []);
    expect(inputContext.getFinalInputs().input1.enum).toEqual([]);

    inputContext.setInput('input1', 'enum', () => [
      {
        value: 'option1',
        label: 'option1',
      },
    ]);
    inputContext.setInput('input1', 'enum', (input: any) => [
      ...input.enum,
      {
        value: 'option2',
        label: 'option2',
      },
    ]);

    expect(
      inputContext
        .getFinalInputs()
        .input1.enum!.map(item => (isObject(item) ? item.value : item)),
    ).toEqual(['option1', 'option2']);
  });
});
