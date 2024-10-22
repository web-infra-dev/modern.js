import { Api, File, Upload, useFiles } from '@modern-js/runtime/koa';
import { z } from 'zod';

const FileSchema = z.object({
  images: z.any(),
});

export const upload = Api(Upload('/upload'), File(FileSchema), async () => {
  const files = useFiles();
  console.log('upload files:>>', files);

  return {
    data: {
      code: 0,
      message: 'success',
    },
  };
});
