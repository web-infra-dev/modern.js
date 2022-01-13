import { Schema } from '@modern-js/easy-form-core';
import { InputType, PluginInputContext } from '../src/context/input';

describe('PluginInputContext Test', () => {
  test('Add Input', () => {
    const inputs = [
      {
        key: 'input1',
        label: 'input1',
      },
      {
        key: 'input2',
        label: 'input2',
      },
    ];
    const inputContext = new PluginInputContext(inputs);

    inputContext.addInputBefore('input2', {
      key: 'input1.2',
      name: 'input1.2',
      type: InputType.Input,
    });

    inputContext.addInputAfter('input1', {
      key: 'input1.1',
      name: 'input1.1',
      type: InputType.Input,
    });

    const finalInputs = inputContext.getFinalInputs();

    expect(finalInputs.length).toBe(4);
    expect(finalInputs.map(item => item.key)).toEqual([
      'input1',
      'input1.1',
      'input1.2',
      'input2',
    ]);
  });
  test('Add Input Error', () => {
    const inputs = [
      {
        key: 'input1',
        label: 'input1',
      },
      {
        key: 'input2',
        label: 'input2',
      },
    ];
    const inputContext = new PluginInputContext(inputs);

    expect(() =>
      inputContext.addInputBefore('input3', {
        key: 'input1.2',
        name: 'input1.2',
        type: InputType.Input,
      }),
    ).toThrow('the input key input3 not found');

    expect(() =>
      inputContext.addInputBefore('input2', {
        key: 'input1',
        name: 'input1',
        type: InputType.Input,
      }),
    ).toThrow('the input key input1 already exists');

    inputContext.addInputAfter('input1', {
      key: 'input1.1',
      name: 'input1.1',
      type: InputType.Input,
    });

    expect(() =>
      inputContext.addInputAfter('input1', {
        key: 'input1.1',
        name: 'input1.1',
        type: InputType.Input,
      }),
    ).toThrow('the input key input1.1 is already added');
  });
  test('Add Input Option', () => {
    const inputs = [
      {
        key: 'input1',
        label: 'input1',
        mutualExclusion: true,
        items: [
          {
            key: 'option1',
            label: 'option1',
          },
          {
            key: 'option2',
            label: 'option2',
          },
        ],
      },
      {
        key: 'input2',
        label: 'input2',
      },
    ];
    const inputContext = new PluginInputContext(inputs);

    inputContext.addOptionBefore('input1', 'option2', {
      key: 'option1.2',
      name: 'option1.2',
    });
    inputContext.addOptionAfter('input1', 'option1', {
      key: 'option1.1',
      name: 'option1.1',
    });

    const finalInputs = inputContext.getFinalInputs();
    expect(finalInputs.length).toBe(2);
    expect(finalInputs[0].items?.length).toBe(4);
    expect((finalInputs[0].items as Schema[])?.map(item => item.key)).toEqual([
      'option1',
      'option1.1',
      'option1.2',
      'option2',
    ]);
  });
  test('Add Input Option Error', () => {
    const inputs = [
      {
        key: 'input1',
        label: 'input1',
        mutualExclusion: true,
        items: [
          {
            key: 'option1',
            label: 'option1',
          },
          {
            key: 'option2',
            label: 'option2',
          },
        ],
      },
      {
        key: 'input2',
        label: 'input2',
      },
    ];
    const inputContext = new PluginInputContext(inputs);

    expect(() =>
      inputContext.addOptionBefore('input1', 'option3', {
        key: 'option1.2',
        name: 'option1.2',
      }),
    ).toThrow('the option key option3 is not found');

    expect(() =>
      inputContext.addOptionAfter('input2', 'option1', {
        key: 'option1.1',
        name: 'option1.1',
      }),
    ).toThrow('the option key option1 is not found');
  });
  test('Set Input', () => {
    const inputs = [
      {
        key: 'input1',
        label: 'input1',
        mutualExclusion: true,
        items: [
          {
            key: 'option1',
            label: 'option1',
          },
          {
            key: 'option2',
            label: 'option2',
          },
        ],
      },
      {
        key: 'input2',
        label: 'input2',
      },
    ];
    const inputContext = new PluginInputContext(inputs);

    inputContext.setInput('input1', 'name', '输入选项一');

    expect(inputContext.getFinalInputs()[0].label).toBe('输入选项一');

    inputContext.addOptionBefore('input1', 'option2', {
      key: 'option1.2',
      name: 'option1.2',
    });
    inputContext.addOptionAfter('input1', 'option1', {
      key: 'option1.1',
      name: 'option1.1',
    });

    inputContext.setInput('input1', 'options', []);
    expect(inputContext.getFinalInputs()[0].items).toEqual([]);

    inputContext.setInput('input1', 'options', () => [
      {
        key: 'option1',
        name: 'option1',
      },
    ]);
    inputContext.setInput('input1', 'options', (input: any) => [
      ...input.options,
      {
        key: 'option2',
        name: 'option2',
      },
    ]);

    inputContext.addOptionAfter('input1', 'option1', {
      key: 'option1.1',
      name: 'option1.1',
    });

    expect(
      (inputContext.getFinalInputs()[0].items as Schema[])?.map(
        item => item.key,
      ),
    ).toEqual(['option1', 'option1.1', 'option2']);
  });
});
