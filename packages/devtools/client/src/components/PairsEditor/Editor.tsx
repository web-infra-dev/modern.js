import { Box, BoxProps } from '@radix-ui/themes';
import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';
import { proxy, useSnapshot } from 'valtio';
import styles from './Editor.module.scss';
import { Pair } from './Pair';
import { PairModel } from './types';

export type PairsEditorProps = BoxProps & {
  $data?: PairModel[];
  disabled?: boolean;
  placeholders?: [string, string];
};

export const PairsEditor: React.FC<PairsEditorProps> = ({
  $data = proxy([]),
  disabled,
  placeholders,
  ...props
}) => {
  const data = useSnapshot($data);

  useEffect(() => {
    if (data.length <= 0) {
      $data.push({
        id: nanoid(),
        key: '',
        value: '',
      });
    }
  }, [data.length]);

  return (
    <Box className={styles.container} {...props}>
      {data.map((rule, i) => (
        <Pair
          key={rule.id}
          $data={$data[i]}
          disabled={disabled}
          placeholders={placeholders}
          onDelete={() => $data.splice(i, 1)}
          onInsert={() =>
            $data.splice(i + 1, 0, { id: nanoid(), key: '', value: '' })
          }
        />
      ))}
    </Box>
  );
};
