import { proxy, useSnapshot } from 'valtio';
import type { StoragePresetContext } from '@modern-js/devtools-kit/runtime';
import { $server } from '../state';

const $presets = proxy<StoragePresetContext[]>([]);

$server.then(async ({ remote }) => {
  const presets = await remote.getStoragePresets();
  $presets.splice(0, $presets.length, ...presets);
});

export default () => {
  const presets = useSnapshot($presets);
  return (
    <div>
      <pre>{JSON.stringify(presets, null, 2)}</pre>
    </div>
  );
};
