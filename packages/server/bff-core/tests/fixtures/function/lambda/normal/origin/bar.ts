export const bar = '/api';

export const get = ({ query: { id } }: { query: { id: string } }) => ({ id });

export const post = ({ data: { id } }: { data: { id: string } }) => ({ id });
