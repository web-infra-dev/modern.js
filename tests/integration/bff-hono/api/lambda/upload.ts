import { Api, Upload } from '@modern-js/plugin-bff/server';
import { z } from 'zod';

const FileSchema = z.object({
  images: z.instanceof(File),
});

export const upload = Api(
  Upload('/upload', FileSchema),
  async ({ formData }) => {
    // do somethings
    return {
      data: {
        code: 10,
        file_name: formData.images.name,
      },
    };
  },
);
