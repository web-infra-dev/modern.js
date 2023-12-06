import _ from 'lodash';
import React, { useMemo } from 'react';
import { Box, Button, Flex, Heading, Link, Text } from '@radix-ui/themes';
import { proxy, useSnapshot } from 'valtio';
import { parseURL } from 'ufo';
import { $state, registerService, unregisterService } from '../state';
import styles from './page.module.scss';
import { PairsEditor } from '@/components/PairsEditor/Editor';
import { ModifyHeaderRule } from '@/utils/service-agent';

const Page: React.FC = () => {
  const state = useSnapshot($state);
  const isActive = Boolean(state.service.href);
  const $rules = useMemo(
    () => proxy((_.cloneDeep(state.service.rules) as ModifyHeaderRule[]) ?? []),
    [],
  );
  const rules = useSnapshot($rules);
  const statusText = isActive ? 'Active' : 'Offline';

  const handleRegister = async () => {
    await registerService(rules.filter(rule => rule.key));
  };

  const handleUnregister = async () => {
    await unregisterService();
  };

  return (
    <Box className={styles.container}>
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
      <PairsEditor
        $data={$rules}
        disabled={isActive}
        my="3"
        placeholders={['Match header field...', 'Replace by...']}
      />
      <Flex justify="end" gap="2">
        {isActive ? (
          <Button color="red" onClick={handleUnregister}>
            Unregister
          </Button>
        ) : (
          <Button onClick={handleRegister}>Register</Button>
        )}
      </Flex>
    </Box>
  );
};

export default Page;
