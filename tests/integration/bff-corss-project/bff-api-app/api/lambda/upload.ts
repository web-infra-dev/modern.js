import { Api, Upload } from '@modern-js/plugin-bff/server';
import { z } from 'zod';

const FileSchema = z.object({
  images: z.record(z.string(), z.any()),
  params: z.string(),
});

export const upload = Api(
  Upload('/upload', FileSchema),
  async ({ formData }) => {
    // do somethings
    return {
      data: {
        code: 0,
        file_name: formData.images.name as string,
        params: JSON.parse(formData.params),
      },
    };
  },
);
