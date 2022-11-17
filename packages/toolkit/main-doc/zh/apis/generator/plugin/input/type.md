---
sidebar_position: 1
---

# 自定义输入相关类型定义

## Input

输入类型结构，其类型定义为：

```ts
interface Input {
    key: string;
    name: string;
    type: 'input' | 'radio' | 'checkbox';
    options?: IOption[];
    validate?: (value: any, data: Record<string, unknown>, extra?: Record<string, unknown>) => {
        success: boolean;
        error?: string;
    } | Promise<{
        success: boolean;
        error?: string;
    >
    when?: (input: Record<string, any>, extra?: Record<string, any>) => Promise<boolean>
}
```

### key

关键字，作为输入字段的 key，可在生成器插件生命周期中通过 `input[key]` 获取到用户输入。

### name

展示名称。

### type

输入类型，包含三种值:

- input：直接输入类型。

- radio：单选类型，需配合 options 使用。

- checkbox：多选类型，需配合 options 使用。

### options

单选和多选类型时选项，选项结构后续介绍。

### validate

验证函数，当用户输入之后，可在该函数中对输入进行验证。其中：

- value 为当前输入字段值

- data 为当前表单的所有输入字段值

- extra 为从 config 参数额外传入的参数

### when

条件函数，用于控制问题是否展示，当该函数返回 true 时，问题展示。其中:

- input 为当前表单的所有输入字段值

- extra 为从 config 参数额外传入的参数

## Option

option 为输入选项，当自定义 Input 类型为 `radio` 或 `checkbox` 时，需要该配置。

option 类型定义为：

```ts
interface IOption {
    key: string;
    name: string;
    isDefault?: boolean; // 是否为默认值，存在多个，以第一个选项为主，当前默认选项正好不展示，将会取第一个展示的选项值
    when?: (input: Record<string, any>, extra?: Record<string, any>) => Promise<boolean> // 问题可根据之前输入决定是否展示
}
```

### key

关键字，option 选项的关键字，当选中该选项是，对应 `input` 的值为该字段值。

### name

展示名称。

### isDefault

是否为默认值，设置为 true 时，展示问题会默认选择该选项

### when

条件函数，用于控制选项是否展示，当该函数返回 true 时，问题展示。其中:

- input 为当前表单的所有输入字段值

- extra 为从 config 参数额外传入的参数
