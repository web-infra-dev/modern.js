import { Badge, Box, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import _ from 'lodash';
import {
  HiPlus,
  HiMiniFlag,
  HiMiniClipboard,
  HiMiniFolderOpen,
  HiMiniFire,
} from 'react-icons/hi2';
import { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
import { FC, useState } from 'react';
import { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import clsx from 'clsx';
import { BadgeProps } from '@radix-ui/themes/dist/cjs/components/badge';
import { useSnapshot } from 'valtio';
import { $serverExported } from '../state';
import styles from './page.module.scss';

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

interface CardButtonProps extends FlexProps {
  selected?: boolean;
}

const CardButton: FC<CardButtonProps> = props => {
  const { className, selected = false, ...rest } = props;
  return (
    <Flex
      data-selected={selected}
      p="3"
      className={clsx(styles.smallCard, className)}
      {...rest}
    />
  );
};

type CardProps = FlexProps;

const Card = (props: CardProps) => {
  const { className, ...rest } = props;
  return <Flex p="3" className={clsx(styles.card, className)} {...rest} />;
};

interface PresetCardProps extends CardButtonProps {
  preset: UnwindPreset;
}

const PresetCard: FC<PresetCardProps> = props => {
  const { preset, ...rest } = props;
  const isSaved = !preset.filename.match(/[/\\]node_modules[/\\]/);

  return (
    <CardButton direction="column" {...rest}>
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
  const { storagePresets } = useSnapshot($serverExported).context;
  const freq = {
    cookie: _(storagePresets)
      .flatMap(preset => _.keys(preset.cookie))
      .countBy()
      .value(),
    localStorage: _(storagePresets)
      .flatMap(preset => _.keys(preset.localStorage))
      .countBy()
      .value(),
    sessionStorage: _(storagePresets)
      .flatMap(preset => _.keys(preset.sessionStorage))
      .countBy()
      .value(),
  };
  const unwindPresets: UnwindPreset[] = storagePresets.map(preset => ({
    name: preset.name,
    filename: preset.filename,
    items: _(unwindPreset(preset))
      .sortBy(item => freq[item.type][item.key] ?? 0)
      .reverse()
      .value(),
  }));
  const [selected, setSelected] = useState<UnwindPreset | null>();
  const matchSelected = (preset: UnwindPreset) =>
    Boolean(
      selected &&
        preset.filename === selected.filename &&
        preset.name === selected.name,
    );

  return (
    <Flex width="100%" className={styles.container}>
      <Flex direction="column" className={styles.sidePanel}>
        <CardButton
          m="2"
          align="center"
          gap="1"
          selected={!selected}
          onClick={() => setSelected(null)}
        >
          <Text size="1" weight="bold">
            Current Storage
          </Text>
          <Text size="1" color="red" asChild>
            <HiMiniFlag />
          </Text>
        </CardButton>
        <Box mx="2" className={styles.divider} />
        <Flex p="2" direction="column" gap="2" className={styles.presetList}>
          {unwindPresets.map(preset => (
            <PresetCard
              key={`${preset.name}@${preset.filename}`}
              selected={matchSelected(preset)}
              onClick={() => setSelected(preset)}
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
      <Flex width="0" grow="1" shrink="1" direction="column" pt="2" gap="2">
        {selected && (
          <Flex
            grow="0"
            px="2"
            gap="2"
            justify="between"
            align="center"
            width="100%"
          >
            <Box shrink="0" className={styles.textEllipsis}>
              <Text size="1" weight="bold" color="gray">
                {selected.name}
              </Text>
            </Box>
            <PresetToolbar shrink="0" grow="0" px="2" justify="end" />
          </Flex>
        )}
        <Box grow="1" pb="2" pr="2" style={{ overflowY: 'scroll' }}>
          {selected && <PresetDetails preset={selected} />}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Page;

interface PresetRecordsCardProps {
  title: string;
  records: UnwindStorageRecord[];
  color: BadgeProps['color'];
}

const PresetRecordsCard: FC<PresetRecordsCardProps> = props => {
  const { title, records, color, ...rest } = props;
  return (
    <Card direction="column" gap="2" {...rest}>
      <Text size="1" weight="bold">
        {title}
      </Text>
      <Flex width="100%" wrap="wrap" align="start" gap="2">
        {records.length === 0 && <Badge color="gray">Empty</Badge>}
        {records.map(record => (
          <Badge key={`${record.type}//${record.key}`} color={color}>
            {record.key}: {record.value}
          </Badge>
        ))}
      </Flex>
    </Card>
  );
};

interface PresetDetailsProps {
  preset: UnwindPreset;
}

const PresetDetails: FC<PresetDetailsProps> = props => {
  const { preset } = props;
  return (
    <Flex direction="column" gap="2">
      <PresetRecordsCard
        title="Cookie"
        records={preset.items.filter(item => item.type === 'cookie')}
        color="yellow"
      />
      <PresetRecordsCard
        title="Local Storage"
        records={preset.items.filter(item => item.type === 'localStorage')}
        color="green"
      />
      <PresetRecordsCard
        title="Session Storage"
        records={preset.items.filter(item => item.type === 'sessionStorage')}
        color="blue"
      />
    </Flex>
  );
};

interface PresetToolbarProps extends FlexProps {
  onCopyAction?: () => void;
  onOpenAction?: () => void;
  onApplyAction?: () => void;
}

const PresetToolbar: FC<PresetToolbarProps> = props => {
  const { onCopyAction, onOpenAction, onApplyAction, ...rest } = props;
  return (
    <Flex position="relative" gap="3" height="5" align="center" {...rest}>
      <Tooltip content="Open File">
        <IconButton onClick={onOpenAction} variant="ghost" color="gray">
          <HiMiniFolderOpen />
        </IconButton>
      </Tooltip>
      <Tooltip content="Copy as Data URI">
        <IconButton onClick={onCopyAction} variant="ghost" color="gray">
          <HiMiniClipboard />
        </IconButton>
      </Tooltip>
      <Tooltip content="Apply Preset">
        <IconButton onClick={onApplyAction} variant="ghost" color="gray">
          <HiMiniFire />
        </IconButton>
      </Tooltip>
    </Flex>
  );
};
