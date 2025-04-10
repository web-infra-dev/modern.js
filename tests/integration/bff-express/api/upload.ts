import { Api, Headers, Params, Upload } from '@modern-js/runtime/server';
import { z } from 'zod';

const FileSchema = z.object({
  images: z.record(z.string(), z.any()),
});

const HeadersSchema = z.object({
  'log-id': z.string(),
});

const ParamsSchema = z.object({
  id: z.string(),
});

export const upload = Api(
  Upload('/upload/:id', FileSchema),
  Headers(HeadersSchema),
  Params(ParamsSchema),
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
