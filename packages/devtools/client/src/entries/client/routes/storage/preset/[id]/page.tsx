import { FC, useEffect } from 'react';
import {
  HiMiniClipboard,
  HiMiniClipboardDocumentList,
  HiMiniFolderOpen,
  HiMiniFire,
} from 'react-icons/hi2';
import { useLoaderData, useRevalidator } from '@modern-js/runtime/router';
import {
  Badge,
  Box,
  Flex,
  IconButton,
  Text,
  Tooltip,
  FlexProps,
} from '@radix-ui/themes';
import {
  StoragePresetContext,
  StoragePresetWithIdent,
} from '@modern-js/devtools-kit/runtime';
import { subscribe } from 'valtio';
import type { BadgeProps } from '@radix-ui/themes/dist/cjs/components/badge';
import {
  applyStorage,
  STORAGE_TYPES,
  StorageStatus,
  StorageType,
  unwindRecord,
  UnwindStorageRecord,
} from '../shared';
import styles from './page.module.scss';
import { useGlobals } from '@/entries/client/globals';
import { useToast } from '@/components/Toast';
import { Card } from '@/components/Card';

type PresetToolbarProps = FlexProps & {
  onCopyAction?: () => void;
  onPasteAction?: () => void;
  onOpenAction?: () => void;
  onApplyAction?: () => void;
};

const PresetToolbar: FC<PresetToolbarProps> = props => {
  const { onCopyAction, onOpenAction, onApplyAction, onPasteAction, ...rest } =
    props;

  return (
    <Flex
      position="relative"
      gap="3"
      height="var(--space-5)"
      align="center"
      {...rest}
    >
      <Tooltip content="Copy as Data URL" delayDuration={200}>
        <IconButton onClick={onCopyAction} variant="ghost" color="gray">
          <HiMiniClipboard />
        </IconButton>
      </Tooltip>
      <Tooltip content="Paste from Data URL" delayDuration={200}>
        <IconButton onClick={onPasteAction} variant="ghost" color="gray">
          <HiMiniClipboardDocumentList />
        </IconButton>
      </Tooltip>
      <Tooltip content="Open File" delayDuration={200}>
        <IconButton onClick={onOpenAction} variant="ghost" color="gray">
          <HiMiniFolderOpen />
        </IconButton>
      </Tooltip>
      <Tooltip content="Apply Preset" delayDuration={200}>
        <IconButton onClick={onApplyAction} variant="ghost" color="gray">
          <HiMiniFire />
        </IconButton>
      </Tooltip>
    </Flex>
  );
};

const applyPreset = async (
  preset: StoragePresetWithIdent,
): Promise<StorageStatus> => {
  const storage: Record<StorageType, Record<string, string>> = {
    cookie: {},
    localStorage: {},
    sessionStorage: {},
  };
  for (const type of STORAGE_TYPES) {
    const records = preset[type];
    records && Object.assign(storage[type], records);
  }
  return await applyStorage(storage);
};

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
            <Badge key={record.id} color={color}>
              {record.key}: {record.value}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
};

const Page = () => {
  const { revalidate } = useRevalidator();
  const $globals = useGlobals();
  const { server } = $globals;
  useEffect(() => {
    const unwatch = subscribe($globals, revalidate);
    return unwatch;
  }, []);
  const preset = useLoaderData() as StoragePresetContext;
  const unwindRecords = [
    ...unwindRecord(preset, 'cookie'),
    ...unwindRecord(preset, 'localStorage'),
    ...unwindRecord(preset, 'sessionStorage'),
  ];

  const applyActionToast = useToast({ content: '🔥 Fired' });
  const copyActionToast = useToast({ content: '📋 Copied' });
  const pasteActionToast = useToast({ content: '📋 Pasted' });

  const handleApplyAction = async () => {
    await applyPreset(preset);
    applyActionToast.open();
    revalidate();
  };

  const handleCopyAction = async () => {
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
    if (!server) return;
    await server.remote.pasteStoragePreset(preset);
    pasteActionToast.open();
  };
  return (
    <Flex direction="column" gap="2">
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
            {preset.name}
          </Text>
        </Box>
        <PresetToolbar
          flexShrink="0"
          flexGrow="0"
          px="2"
          justify="end"
          onCopyAction={handleCopyAction}
          onPasteAction={handlePasteAction}
          onOpenAction={() => server?.remote.open(preset.filename)}
          onApplyAction={handleApplyAction}
        />
      </Flex>
      <Box flexGrow="1" pb="2" pr="2" style={{ overflowY: 'scroll' }}>
        <Flex direction="column" gap="2">
          <PresetRecordsCard
            title="Cookie"
            records={unwindRecords.filter(item => item.type === 'cookie')}
            color="yellow"
          />
          <PresetRecordsCard
            title="Local Storage"
            records={unwindRecords.filter(item => item.type === 'localStorage')}
            color="green"
          />
          <PresetRecordsCard
            title="Session Storage"
            records={unwindRecords.filter(
              item => item.type === 'sessionStorage',
            )}
            color="blue"
          />
        </Flex>
      </Box>
      {applyActionToast.element}
      {copyActionToast.element}
      {pasteActionToast.element}
    </Flex>
  );
};

export default Page;
