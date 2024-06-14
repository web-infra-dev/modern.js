import { Box, IconButton, TextField } from '@radix-ui/themes';
import React from 'react';
import { HiMinusSmall, HiPlusSmall } from 'react-icons/hi2';
import { useSnapshot } from 'valtio';
import styles from './Pair.module.scss';
import { PairModel } from './types';

export interface PairProps {
  $data: PairModel;
  onDelete?: () => void;
  onInsert?: () => void;
  disabled?: boolean;
  placeholders?: [string, string];
}

export const Pair: React.FC<PairProps> = ({
  $data,
  onDelete,
  onInsert,
  disabled,
  placeholders = ['Key...', 'Value...'],
}) => {
  const data = useSnapshot($data);

  return (
    <Box key={data.id} className={styles.inputPair} aria-disabled={disabled}>
      <TextField.Root
        value={data.key}
        disabled={disabled}
        placeholder={placeholders[0]}
        onChange={e => ($data.key = e.currentTarget.value)}
      />
      <Box asChild flexGrow="1">
        <TextField.Root
          value={data.value}
          disabled={disabled}
          placeholder={placeholders[1]}
          onChange={e => ($data.value = e.currentTarget.value)}
        />
      </Box>
      <Box className={styles.actions}>
        <IconButton variant="ghost" color="gray" onClick={onDelete}>
          <HiMinusSmall />
        </IconButton>
        <IconButton variant="ghost" color="gray" onClick={onInsert}>
          <HiPlusSmall />
        </IconButton>
      </Box>
    </Box>
  );
};
