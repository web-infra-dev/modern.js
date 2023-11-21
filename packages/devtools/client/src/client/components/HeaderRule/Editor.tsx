import React, { ChangeEvent } from 'react';
import styles from './Editor.module.scss';
import { ModifyHeaderRule } from '@/client/utils/service-agent';

export interface HeaderRuleEditorProps {
  value?: ModifyHeaderRule[];
  onChangeRule?: (index: number, value: ModifyHeaderRule) => void;
  onDeleteRule?: (index: number) => void;
  onCreateRule?: (index: number, value: ModifyHeaderRule) => void;
}

export const HeaderRuleEditor: React.FC<HeaderRuleEditorProps> = ({
  value = [],
  onChangeRule,
  onDeleteRule,
  onCreateRule,
}) => {
  const createInputHandler = (type: 'key' | 'value', index: number) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      onChangeRule?.(index, {
        ...value[index],
        [type]: e.target.value,
      });
    };
  };

  const handleAppendRule = () => {
    onCreateRule?.(value.length - 1, {
      id: Date.now().toString(),
      key: '',
      value: '',
    });
  };

  const handlePopRule = () => {
    onDeleteRule?.(value.length - 1);
  };

  return (
    <div className={styles.container}>
      {value?.map((rule, i) => (
        <div key={rule.id}>
          <input value={rule.key} onChange={createInputHandler('key', i)} />
          <input value={rule.value} onChange={createInputHandler('value', i)} />
        </div>
      ))}
      <button onClick={handleAppendRule}>+</button>
      <button onClick={handlePopRule}>-</button>
    </div>
  );
};
