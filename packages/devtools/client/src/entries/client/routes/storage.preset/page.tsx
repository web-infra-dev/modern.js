/* eslint-disable max-lines */
import { StoragePresetWithIdent } from '@modern-js/devtools-kit/runtime';
import { Badge, Box, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { BadgeProps } from '@radix-ui/themes/dist/cjs/components/badge';
import { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import clsx from 'clsx';
import _ from 'lodash';
import { FC, useState } from 'react';
import {
  HiMiniClipboard,
  HiMiniClipboardDocumentList,
  HiMiniFire,
  HiMiniFlag,
  HiMiniFolderOpen,
  HiPlus,
} from 'react-icons/hi2';
import { useSnapshot } from 'valtio';
import { $mountPoint, $server, $serverExported } from '../state';
import styles from './page.module.scss';
import { useToast } from '@/components/Toast';
import { useThrowable } from '@/utils';

const unwindRecord = (preset: StoragePresetWithIdent, type: StorageType) =>
  _.map(preset[type], (value, key) => {
    const id = [preset.id, type, key].join('//');
    const ret: UnwindStorageRecord = { key, value, type, id };
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
  id: string;
  key: string;
  value: string;
  type: StorageType;
}

const unwindPreset = (preset: StoragePresetWithIdent) => {
  const ret: UnwindStorageRecord[] = [];
  for (const type of STORAGE_TYPES) {
    ret.push(...unwindRecord(preset, type));
  }
  return ret;
};

interface UnwindPreset {
  id: string;
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
          {preset.items.length === 0 && <Badge color="gray">Empty</Badge>}
          {preset.items.map(item => (
            <Badge key={item.id} color={STORAGE_TYPE_PALETTE[item.type]}>
              {item.key}: {item.value}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </CardButton>
  );
};

const applyPreset = async (preset: UnwindPreset | StoragePresetWithIdent) => {
  const mountPoint = await $mountPoint;
  const storage: Record<StorageType, Record<string, string>> = {
    cookie: {},
    localStorage: {},
    sessionStorage: {},
  };
  if ('items' in preset) {
    for (const item of preset.items) {
      storage[item.type][item.key] = item.value;
    }
  } else {
    for (const type of STORAGE_TYPES) {
      const records = preset[type];
      records && Object.assign(storage[type], records);
    }
  }
  await Promise.all([
    mountPoint.remote.cookies(storage.cookie),
    mountPoint.remote.localStorage(storage.localStorage),
    mountPoint.remote.sessionStorage(storage.sessionStorage),
  ]);
};

const Page: FC = () => {
  const { storagePresets } = useSnapshot($serverExported).context;
  const server = useThrowable($server);
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
    id: preset.id,
    name: preset.name,
    filename: preset.filename,
    items: _(unwindPreset(preset))
      .sortBy(item => freq[item.type][item.key] ?? 0)
      .reverse()
      .value(),
  }));

  const [select, setSelect] = useState<string>();
  const selected = _.find(unwindPresets, { id: select });

  const handleCreatePreset = async () => {
    const newPreset = await server.remote.createTemporaryStoragePreset();
    setSelect(newPreset.id);
  };

  const applyActionToast = useToast({ content: '🔥 Fired' });
  const copyActionToast = useToast({ content: '📋 Copied' });
  const pasteActionToast = useToast({ content: '📋 Pasted' });

  const handleApplyAction = async () => {
    if (!selected) return;
    await applyPreset(selected);
    applyActionToast.open();
  };

  const handleCopyAction = async () => {
    if (!selected) return;
    const preset: StoragePresetWithIdent = {
      id: selected.id,
      name: selected.name,
      cookie: {},
      localStorage: {},
      sessionStorage: {},
    };
    for (const { type, key, value } of selected.items) {
      preset[type]![key] = value;
    }
    const stringified = JSON.stringify(preset);
    const blob = new Blob([stringified], { type: 'application/json' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    const uri = await new Promise<string | null>(resolve => {
      reader.onload = e => resolve(e.target?.result?.toString() ?? null);
    });
    if (uri) {
      navigator.clipboard.writeText(uri);
      copyActionToast.open();
    } else {
      console.error('Failed to copy preset as data URL');
    }
  };
  const handlePasteAction = async () => {
    if (!selected) return;
    await server.remote.pasteStoragePreset(selected);
    pasteActionToast.open();
  };

  return (
    <Flex width="100%" className={styles.container}>
      <Flex direction="column" className={styles.sidePanel}>
        <CardButton
          m="2"
          align="center"
          gap="1"
          selected={!select}
          onClick={() => setSelect(undefined)}
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
              key={preset.id}
              selected={select === preset.id}
              onClick={() => setSelect(preset.id)}
              preset={preset}
            />
          ))}
          <CardButton
            justify="center"
            align="center"
            onClick={handleCreatePreset}
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
            <PresetToolbar
              shrink="0"
              grow="0"
              px="2"
              justify="end"
              onCopyAction={handleCopyAction}
              onPasteAction={handlePasteAction}
              onOpenAction={() => server.remote.open(selected.filename)}
              onApplyAction={handleApplyAction}
            />
          </Flex>
        )}
        <Box grow="1" pb="2" pr="2" style={{ overflowY: 'scroll' }}>
          {selected && <PresetDetails preset={selected} />}
        </Box>
        {applyActionToast.element}
        {copyActionToast.element}
        {pasteActionToast.element}
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
          <Badge key={record.id} color={color}>
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
  onPasteAction?: () => void;
  onOpenAction?: () => void;
  onApplyAction?: () => void;
}

const PresetToolbar: FC<PresetToolbarProps> = props => {
  const { onCopyAction, onOpenAction, onApplyAction, onPasteAction, ...rest } =
    props;

  return (
    <Flex position="relative" gap="3" height="5" align="center" {...rest}>
      <Tooltip content="Copy as Data URL">
        <IconButton onClick={onCopyAction} variant="ghost" color="gray">
          <HiMiniClipboard />
        </IconButton>
      </Tooltip>
      <Tooltip content="Paste from Data URL">
        <IconButton onClick={onPasteAction} variant="ghost" color="gray">
          <HiMiniClipboardDocumentList />
        </IconButton>
      </Tooltip>
      <Tooltip content="Open File">
        <IconButton onClick={onOpenAction} variant="ghost" color="gray">
          <HiMiniFolderOpen />
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
