import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { FC } from 'react';
import _ from 'lodash';
import type { BadgeProps } from '@radix-ui/themes/dist/cjs/components/badge';
import { useLoaderData } from '@modern-js/runtime/router';
import styles from './page.module.scss';
import { StorageStatus } from './shared';
import { Card } from '@/components/Card';

interface UnwindStorageRecord {
  id: string;
  key: string;
  value: string;
}

interface PresetRecordsCardProps {
  title: string;
  records: UnwindStorageRecord[];
  color: BadgeProps['color'];
}

const PresetRecordsCard: FC<PresetRecordsCardProps> = props => {
  const { title, records, color, ...rest } = props;
  return (
    <Card asChild {...rest}>
      <Flex direction="column" gap="2">
        <Text size="1" weight="bold">
          {title}
        </Text>
        <Flex width="100%" wrap="wrap" align="start" gap="2">
          {records.length === 0 && <Badge color="gray">Empty</Badge>}
          {records.map(record => (
            <Badge key={record.id} color={color} className={styles.badge}>
              {record.key}: {record.value}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
};

const Page: FC = () => {
  const data = useLoaderData() as StorageStatus;
  const cookie: UnwindStorageRecord[] = _.map(
    data.cookie.client,
    (value, key) => ({ key, value, id: key }),
  );
  const cookieHttp: UnwindStorageRecord[] = _.map(
    data.cookie.server,
    (value, key) => ({ key, value, id: key }),
  );
  const localStorage: UnwindStorageRecord[] = _.map(
    data.localStorage,
    (value, key) => ({ key, value, id: key }),
  );
  const sessionStorage: UnwindStorageRecord[] = _.map(
    data.sessionStorage,
    (value, key) => ({ key, value, id: key }),
  );
  return (
    <Flex direction="column" gap="2" height="100%" flexShrink="1">
      <Flex
        flexGrow="0"
        px="2"
        gap="2"
        justify="between"
        align="center"
        width="100%"
      >
        <Box flexShrink="0" className={styles.textEllipsis}>
          <Text size="1" weight="bold" color="gray">
            Current Storage
          </Text>
        </Box>
      </Flex>
      <Box flexGrow="1" pb="2" pr="2" className={styles.scrollable}>
        <Flex direction="column" gap="2">
          <PresetRecordsCard title="Cookie" records={cookie} color="yellow" />
          <PresetRecordsCard
            title="Cookie (HTTP Only)"
            records={cookieHttp}
            color="yellow"
          />
          <PresetRecordsCard
            title="Local Storage"
            records={localStorage}
            color="green"
          />
          <PresetRecordsCard
            title="Session Storage"
            records={sessionStorage}
            color="blue"
          />
        </Flex>
      </Box>
    </Flex>
  );
};

export default Page;
