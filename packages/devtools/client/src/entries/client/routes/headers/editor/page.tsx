import _ from 'lodash';
import React, { useMemo } from 'react';
import { Box, Button, Flex, Heading, Link, Text } from '@radix-ui/themes';
import { proxy, snapshot, useSnapshot } from 'valtio';
import { parseURL } from 'ufo';
import { useLoaderData, useRevalidator } from '@modern-js/runtime/router';
import styles from './page.module.scss';
import { LoaderData } from './page.data';
import { PairsEditor } from '@/components/PairsEditor/Editor';
import { ModifyHeaderRule } from '@/utils/service-agent';
import { useGlobals } from '@/entries/client/globals';
import { useToast } from '@/components/Toast';

const Page: React.FC = () => {
  const { mountPoint } = useSnapshot(useGlobals());
  const { revalidate } = useRevalidator();

  const sw = useLoaderData() as LoaderData;
  const isActive = Boolean(sw);
  const $rules = useMemo(
    () => proxy((_.cloneDeep(sw?.rules) as ModifyHeaderRule[]) ?? []),
    [],
  );

  const statusText = isActive ? 'Active' : 'Offline';

  const applyToast = useToast({ content: '🔥 Fired' });
  const resetToast = useToast({ content: '🔄 Reset all rules' });
  const unregisterToast = useToast({ content: '✅ Unregistered' });

  const handleApply = async () => {
    !isActive && (await mountPoint.remote.registerService());
    await mountPoint.remote.applyModifyHeaderRules(snapshot($rules) as any);
    applyToast.open();
    revalidate();
  };
  const handleReset = async () => {
    $rules.length = 0;
    await mountPoint.remote.applyModifyHeaderRules([]);
    resetToast.open();
    revalidate();
  };
  const handleUnregister = async () => {
    await mountPoint.remote.unregisterService();
    unregisterToast.open();
    revalidate();
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
        my="3"
        placeholders={['Match header field...', 'Replace by...']}
      />
      <Flex justify="end" direction="row-reverse" gap="2">
        <Button onClick={handleApply}>Apply</Button>
        <Box flexGrow="1" />
        {isActive ? (
          <Button variant="outline" color="red" onClick={handleUnregister}>
            Unregister
          </Button>
        ) : null}
        {isActive ? (
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        ) : null}
      </Flex>
      {applyToast.element}
      {resetToast.element}
      {unregisterToast.element}
    </Box>
  );
};

export default Page;
