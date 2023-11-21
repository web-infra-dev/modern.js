import _ from 'lodash';
import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Link, Text } from '@radix-ui/themes';
import { useList } from 'react-use';
import { useSnapshot } from 'valtio';
import { parseURL } from 'ufo';
import { $state, registerService, unregisterService } from '../state';
import styles from './page.module.scss';
import { HeaderRuleEditor } from '@/client/components/HeaderRule/Editor';

const Page: React.FC = () => {
  const state = useSnapshot($state);
  const isActive = Boolean(state.service.href);
  const [rules, $rules] = useList(() =>
    state.service.rules?.length
      ? _.slice(state.service.rules)
      : [{ id: Date.now().toString(), key: '', value: '' }],
  );
  const [isOutdated, setIsOutdated] = useState(false);
  let statusText = isActive ? 'Active' : 'Offline';
  if (isOutdated && isActive) {
    statusText = 'Outdated';
  }

  const withOutdate = <T extends (...args: any[]) => any>(func: T): T => {
    const wrapped = (...args: any[]) => {
      setIsOutdated(true);
      return func(...args);
    };
    return wrapped as T;
  };

  const handleRegister = async () => {
    setIsOutdated(false);
    await registerService(rules);
  };

  const handleUnregister = async () => {
    setIsOutdated(false);
    await unregisterService();
  };

  return (
    <div className={styles.container}>
      <Heading mt="4">Header Modifier</Heading>
      <Flex align="center" gap="1">
        <Box className={styles.signal} data-active={isActive} />
        <Text color="gray" size={'1'}>
          {statusText}
        </Text>
        {state.service.href && (
          <Link size="1" href={state.service.href} target="_blank">
            {parseURL(state.service.href).pathname}
          </Link>
        )}
      </Flex>
      <HeaderRuleEditor
        value={rules}
        my="4"
        onChangeRule={withOutdate($rules.updateAt)}
        onCreateRule={withOutdate($rules.insertAt)}
        onDeleteRule={withOutdate($rules.removeAt)}
      />
      <Flex justify="end" gap="2">
        <Button onClick={handleRegister}>Register</Button>
        <Button onClick={handleUnregister} color="gray">
          Unregister
        </Button>
      </Flex>
    </div>
  );
};

export default Page;
