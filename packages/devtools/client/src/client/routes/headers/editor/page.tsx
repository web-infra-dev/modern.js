import _ from 'lodash';
import React from 'react';
import { useList } from 'react-use';
import { useSnapshot } from 'valtio';
import { $state, registerService, unregisterService } from '../state';
import { HeaderRuleEditor } from '@/client/components/HeaderRule/Editor';

const Page: React.FC = () => {
  const state = useSnapshot($state);
  const [rules, $rules] = useList(() => _.slice(state.service.rules));

  return (
    <div>
      <div>Editor</div>
      <HeaderRuleEditor
        value={rules}
        onChangeRule={$rules.updateAt}
        onCreateRule={$rules.insertAt}
        onDeleteRule={$rules.removeAt}
      />
      <button onClick={() => registerService(rules)}>register</button>
      <button onClick={unregisterService}>unregister</button>
    </div>
  );
};

export default Page;
