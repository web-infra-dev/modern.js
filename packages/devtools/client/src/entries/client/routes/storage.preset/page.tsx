import { useLoaderData } from '@modern-js/runtime/router';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import _ from 'lodash';
import { HiPlus, HiMiniFlag } from 'react-icons/hi2';
import { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
import { FC } from 'react';
import { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import clsx from 'clsx';
import styles from './page.module.scss';
import type { Data } from './page.data';

const unwindRecord = <T extends string | void>(
  record: Record<string, string>,
  type: T,
) =>
  _.map(record, (value, key) => {
    const ret = { key, value } as { key: string; value: string; type: T };
    if (type) {
      ret.type = type;
    }
    return ret;
  });

const STORAGE_TYPES = ['cookie', 'localStorage', 'sessionStorage'] as const;
const STORAGE_TYPE_PALETTE = {
  cookie: 'yellow',
  localStorage: 'green',
  sessionStorage: 'blue',
} as const;

type StorageType = (typeof STORAGE_TYPES)[number];

interface UnwindStorageRecord {
  key: string;
  value: string;
  type: StorageType;
}

const unwindPreset = (preset: StoragePresetContext) => {
  const ret: UnwindStorageRecord[] = [];
  for (const type of STORAGE_TYPES) {
    const records = preset[type];
    if (records) {
      ret.push(...unwindRecord(records, type));
    }
  }
  return ret;
};

interface UnwindPreset {
  name: string;
  filename: string;
  items: UnwindStorageRecord[];
}

const CardButton: FC<FlexProps> = ({ className, ...props }) => {
  return <Flex className={clsx(styles.smallCard, className)} {...props} />;
};

const PresetCard: FC<{ preset: UnwindPreset }> = props => {
  const { preset } = props;
  const isSaved = !preset.filename.match(/[/\\]node_modules[/\\]/);

  return (
    <CardButton direction="column">
      <Text size="1" weight="bold" as="p" mb="2">
        {preset.name}{' '}
        {isSaved || (
          <Text size="1" color="gray">
            *
          </Text>
        )}
      </Text>
      <Flex align={'center'}>
        <Flex className={styles.previewBadgeList}>
          {preset.items.map(item => (
            <Badge
              key={`${item.type}//${item.key}`}
              color={STORAGE_TYPE_PALETTE[item.type]}
            >
              {item.key}: {item.value}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </CardButton>
  );
};

const Page: FC = () => {
  const data = useLoaderData() as Data;
  const freq = {
    cookie: _(data.presets)
      .flatMap(preset => _.keys(preset.cookie))
      .countBy()
      .value(),
    localStorage: _(data.presets)
      .flatMap(preset => _.keys(preset.localStorage))
      .countBy()
      .value(),
    sessionStorage: _(data.presets)
      .flatMap(preset => _.keys(preset.sessionStorage))
      .countBy()
      .value(),
  };
  const presets: UnwindPreset[] = data.presets.map(preset => ({
    name: preset.name,
    filename: preset.filename,
    items: _(unwindPreset(preset))
      .sortBy(item => freq[item.type][item.key] ?? 0)
      .reverse()
      .value(),
  }));

  return (
    <Box className={styles.container}>
      <Flex direction="column" p="2" pb="0" className={styles.sidePanel}>
        <CardButton align="center" gap="1">
          <Text size="1" weight="bold">
            Current Storage
          </Text>
          <Text size="1" color="red" asChild>
            <HiMiniFlag />
          </Text>
        </CardButton>
        <Box mt="2" className={styles.divider} />
        <Flex direction="column" py="2" gap="2" className={styles.presetList}>
          {presets.map(preset => (
            <PresetCard
              key={`${preset.name}@${preset.filename}`}
              preset={preset}
            />
          ))}
          <CardButton
            justify="center"
            align="center"
            className={styles.btnCreatePreset}
          >
            <HiPlus />
          </CardButton>
        </Flex>
      </Flex>
      <Box grow={'1'} />
    </Box>
  );
};

export default Page;
