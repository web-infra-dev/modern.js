import { FC } from 'react';
import {
  HiMiniClipboard,
  HiMiniClipboardDocumentList,
  HiMiniFolderOpen,
  HiMiniFire,
} from 'react-icons/hi2';
import { useParams } from '@modern-js/runtime/router';
import { Badge, Box, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import _ from 'lodash';
import { useSnapshot } from 'valtio';
import { StoragePresetWithIdent } from '@modern-js/devtools-kit/runtime';
import type { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
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
import { $server, $serverExported } from '@/entries/client/routes/state';
import { useToast } from '@/components/Toast';
import { useThrowable } from '@/utils';
import { Card } from '@/components/Card';

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
  const { id } = useParams();
  if (!id) throw new TypeError('storage preset id is required');
  const { storagePresets } = useSnapshot($serverExported).context;
  const preset = _.find(storagePresets, { id });
  if (!preset) throw new TypeError('storage preset not found');
  const unwindRecords = [
    ...unwindRecord(preset, 'cookie'),
    ...unwindRecord(preset, 'localStorage'),
    ...unwindRecord(preset, 'sessionStorage'),
  ];

  const server = useThrowable($server);
  const applyActionToast = useToast({ content: '🔥 Fired' });
  const copyActionToast = useToast({ content: '📋 Copied' });
  const pasteActionToast = useToast({ content: '📋 Pasted' });

  const handleApplyAction = async () => {
    await applyPreset(preset);
    applyActionToast.open();
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
    await server.remote.pasteStoragePreset(preset);
    pasteActionToast.open();
  };
  return (
    <Flex direction="column" gap="2">
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
            {preset.name}
          </Text>
        </Box>
        <PresetToolbar
          shrink="0"
          grow="0"
          px="2"
          justify="end"
          onCopyAction={handleCopyAction}
          onPasteAction={handlePasteAction}
          onOpenAction={() => server.remote.open(preset.filename)}
          onApplyAction={handleApplyAction}
        />
      </Flex>
      <Box grow="1" pb="2" pr="2" style={{ overflowY: 'scroll' }}>
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
