import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  source: {
    mainEntryName: 'index',
  },
  html: {
    title({ entryName }) {
      if (entryName === 'index') {
        return 'TikTok';
      }
    },
  },
});
