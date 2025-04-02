import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  source: {
    mainEntryName: 'index',
  },
  html: {
    titleByEntries: {
      index: 'TikTok',
    },
  },
});
