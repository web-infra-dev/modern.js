import _ from 'lodash';
import React, { ChangeEvent } from 'react';
import { useList } from 'react-use';
import { useSnapshot } from 'valtio';
import { $state, registerService, unregisterService } from '../state';

const Page: React.FC = () => {
  const state = useSnapshot($state);
  const [rules, $rules] = useList(
    _.slice(state.service.rules).map(s => ({
      ...s,
      id: Math.random().toString(),
    })),
  );

  const createInputHandler = (type: 'key' | 'value', index: number) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const oldValue = rules[index];
      const newValue = {
        ...oldValue,
        [type]: e.target.value,
      };
      $rules.update(_.matches(oldValue), newValue);
    };
  };

  return (
    <div>
      <div>Editor</div>
      {rules.map((rule, i) => (
        <div key={rule.id}>
          <input value={rule.key} onChange={createInputHandler('key', i)} />
          <input value={rule.value} onChange={createInputHandler('value', i)} />
        </div>
      ))}
      <button
        onClick={() =>
          $rules.push({ id: Math.random().toString(), key: '', value: '' })
        }
      >
        +
      </button>
      <button onClick={() => $rules.removeAt(-1)}>-</button>
      <button onClick={() => registerService(rules as any)}>register</button>
      <button onClick={unregisterService}>unregister</button>
    </div>
  );
};

export default Page;
