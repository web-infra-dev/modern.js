import { Api, HttpCode, SetHeaders, Upload } from '@modern-js/bff-core';
import { z } from 'zod';

export const get = Api(
  HttpCode(202),
  SetHeaders({ 'x-bff': 'modern' }),
  input => input,
);

export const post = Api(
  Upload('/upload', z.object({ images: z.file(), params: z.string() })),
  async ({ formData }) => ({
    file_name: formData.images.name,
    file_type: formData.images.type,
    file_content: await formData.images.text(),
    params: JSON.parse(formData.params),
  }),
);
