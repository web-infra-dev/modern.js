import _ from 'lodash';
import React from 'react';
import { Button, Flex, Heading } from '@radix-ui/themes';
import { useList } from 'react-use';
import { useSnapshot } from 'valtio';
import { $state, registerService, unregisterService } from '../state';
import styles from './page.module.scss';
import { HeaderRuleEditor } from '@/client/components/HeaderRule/Editor';

const Page: React.FC = () => {
  const state = useSnapshot($state);
  const [rules, $rules] = useList(() => _.slice(state.service.rules));

  return (
    <div className={styles.container}>
      <Heading mt="4">Editor</Heading>
      <HeaderRuleEditor
        value={rules}
        my="4"
        onChangeRule={$rules.updateAt}
        onCreateRule={$rules.insertAt}
        onDeleteRule={$rules.removeAt}
      />
      <Flex justify="end" gap="2">
        <Button onClick={() => registerService(rules)}>Register</Button>
        <Button color="gray" onClick={unregisterService}>
          Unregister
        </Button>
      </Flex>
    </div>
  );
};

export default Page;
