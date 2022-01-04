import { Response as NodeResponse } from 'node-fetch';

const handleRes = (res: Response | NodeResponse) => {
  const contentType = res.headers.get('content-type');

  if (
    contentType?.includes('application/json') ||
    contentType?.includes('text/json')
  ) {
    return res.json();
  }

  if (
    contentType?.includes('text/html') ||
    contentType?.includes('text/plain')
  ) {
    return res.text();
  }

  if (
    (contentType?.includes('application/x-www-form-urlencoded') ||
      contentType?.includes('multipart/form-data')) &&
    res instanceof Response
  ) {
    return res.formData();
  }

  if (contentType?.includes('application/octet-stream')) {
    return res.arrayBuffer();
  }

  return res.text();
};

export { handleRes };
