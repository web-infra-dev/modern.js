import _ from 'lodash';
import React, { useMemo } from 'react';
import { Box, Button, Flex, Heading, Link, Text } from '@radix-ui/themes';
import { proxy, snapshot, useSnapshot } from 'valtio';
import { parseURL } from 'ufo';
import { useLoaderData } from '@modern-js/runtime/router';
import styles from './page.module.scss';
import { LoaderData } from './page.data';
import { PairsEditor } from '@/components/PairsEditor/Editor';
import { ModifyHeaderRule } from '@/utils/service-agent';
import { useGlobals } from '@/entries/client/globals';

const Page: React.FC = () => {
  const { mountPoint } = useSnapshot(useGlobals());
  const sw = useLoaderData() as LoaderData;
  const isActive = Boolean(sw);
  const $rules = useMemo(
    () => proxy((_.cloneDeep(sw?.rules) as ModifyHeaderRule[]) ?? []),
    [],
  );
  const statusText = isActive ? 'Active' : 'Offline';
  const handleRegister = async () => {
    await mountPoint.remote.registerService();
    // TODO: wait utils service has being ready.
    await mountPoint.remote.applyModifyHeaderRules(snapshot($rules) as any);
  };

  return (
    <Box className={styles.container}>
      <Heading mt="4">Header Modifier</Heading>
      <Flex align="center" gap="1">
        <Box className={styles.signal} data-active={isActive} />
        <Text color="gray" size={'1'}>
          {statusText}
        </Text>
        {sw?.href && (
          <Link size="1" href={sw.href} target="_blank">
            {parseURL(sw.href).pathname}
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
          <Button
            color="red"
            onClick={() => mountPoint.remote.unregisterService()}
          >
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
