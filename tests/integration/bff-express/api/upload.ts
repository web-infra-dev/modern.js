import { Api, Upload } from '@modern-js/runtime/server';
import { z } from 'zod';

const FileSchema = z.object({
  images: z.record(z.string(), z.any()),
});

export const upload = Api(Upload('/upload', FileSchema), async req => {
  console.info('formData:', req.formData);
  // do somethings
  return {
    data: {
      code: 0,
    },
  };
});
