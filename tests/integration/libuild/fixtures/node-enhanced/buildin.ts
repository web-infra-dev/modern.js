import path from 'path';
import fs from 'fs';

export const root = path.join(__dirname, 'test');
export const file = fs.readFileSync(root);
