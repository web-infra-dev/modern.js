import React from 'react';
import styled from 'styled-components';
import Anchor from 'antd/es/anchor';

const AnchorLink = Anchor.Link;

const DocsToc = ({ entries }) => {
  return (
    <Anchor affix={false} scrollContainer=".markdown-body">
      {entries.map(entry => (
        <AnchorLink
          key={entry.slug}
          href={`#${entry.slug}`}
          title={entry.text}
        />
      ))}
    </Anchor>
  );
};
export default DocsToc;
