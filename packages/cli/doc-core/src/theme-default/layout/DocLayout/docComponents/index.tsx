import { H1, H2, H3, H4, H5, H6 } from './title';
import { Ul, Ol, Li } from './list';
import { Table, Td, Th, Tr } from './table';
import { Hr } from './hr';
import { A } from './link';
import { P, Strong, Blockquote } from './paragraph';
import { Code } from './code';
import { Pre } from './pre';

export function getCustomMDXComponent() {
  return {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    ul: Ul,
    ol: Ol,
    li: Li,
    table: Table,
    td: Td,
    th: Th,
    tr: Tr,
    hr: Hr,
    p: P,
    blockquote: Blockquote,
    strong: Strong,
    a: A,
    code: Code,
    pre: Pre,
  };
}
