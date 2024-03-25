import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import _ from 'lodash';
import { HiPlus } from 'react-icons/hi2';
import { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
import { FC } from 'react';
import { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import styles from './page.module.scss';

interface Data {
  presets: StoragePresetContext[];
  storage: {
    cookie: { client: Record<string, string>; server: Record<string, string> };
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
}

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

const PresetCard: FC<{ preset: UnwindPreset }> = props => {
  const { preset } = props;
  const isSaved = !preset.filename.match(/[/\\]node_modules[/\\]/);

  return (
    <Box className={styles.presetCard}>
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
    </Box>
  );
};

const CreatePresetButton: FC<FlexProps> = props => {
  return (
    <Flex
      className={styles.btnCreatePreset}
      justify="center"
      align="center"
      {...props}
    >
      <HiPlus />
    </Flex>
  );
};

const Page: FC = () => {
  const data: Data = {
    presets: [
      {
        name: '用户asdasd',
        filename: '',
        cookie: {
          lang: 'zh',
          'x-tt-jwt': 'eC10dC1qd3Q=',
        },
        localStorage: {
          __cache_first_1161: '1',
        },
      },
      {
        name: '商家运营',
        filename: '',
        cookie: {
          'x-tt-jwt': '5ZWG5a626L+Q6JCl',
        },
      },
      {
        name: '商家管理员',
        filename: '',
        localStorage: {
          __cache_first_1161: '1',
        },
        cookie: {
          'x-tt-jwt': '5ZWG5a62566h55CG5ZGY',
        },
      },
    ],
    storage: {
      cookie: {
        client: {
          lang: 'zh',
        },
        server: {
          'x-tt-jwt': 'eC10dC1qd3Q=',
        },
      },
      localStorage: {
        __cache_first_1161: '1',
      },
      sessionStorage: {},
    },
  };

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
      <Flex direction="column" gap="2" className={styles.sidePanel}>
        {presets.map(preset => (
          <PresetCard
            key={`${preset.name}@${preset.filename}`}
            preset={preset}
          />
        ))}
        <CreatePresetButton />
      </Flex>
      <Box grow={'1'} />
    </Box>
  );
};

export default Page;
