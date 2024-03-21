import { useLoaderData } from '@modern-js/runtime/router';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import _ from 'lodash';
import { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
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

export default () => {
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
    <Flex wrap="wrap">
      <Box width={{ initial: '100%', xs: '9' }}>
        {presets.map(preset => (
          <Box key={`${preset.name}@${preset.filename}`}>
            <Text as="p">{preset.name}</Text>
            <Flex gap="1">
              {preset.items.map(item => (
                <Badge
                  key={`${item.type}//${item.key}`}
                  color={STORAGE_TYPE_PALETTE[item.type]}
                >
                  {item.key}: {item.value}
                </Badge>
              ))}
            </Flex>
          </Box>
        ))}
      </Box>
      <Box grow={'1'} />
    </Flex>
  );
};
