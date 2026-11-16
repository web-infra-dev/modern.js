import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { type Post, imageSize } from '../posts';

// The build plugin and optional BFF handler use the same renderer and fonts.
// BFF builds copy shared assets into dist/shared and then .output/shared.
const fonts = [
  {
    name: 'Inter',
    data: readFileSync(
      path.join(__dirname, 'assets/inter-latin-400-normal.woff'),
    ),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Inter',
    data: readFileSync(
      path.join(__dirname, 'assets/inter-latin-700-normal.woff'),
    ),
    weight: 700 as const,
    style: 'normal' as const,
  },
];

export async function renderOgImage(post: Post) {
  const svg = await satori(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '52px 64px',
        backgroundColor: '#102b29',
        color: '#f7f4e8',
        fontFamily: 'Inter',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -100,
          top: -180,
          width: 500,
          height: 500,
          border: '1px solid #41615a',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 18, height: 18, backgroundColor: '#d9ee8d' }} />
          <span style={{ fontWeight: 700 }}>Modern.js Journal</span>
        </div>
        <span style={{ color: '#b4c7bf', fontSize: 18 }}>
          IDEAS INTO EXPERIENCES
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 68,
        }}
      >
        <div style={{ color: '#d9ee8d', fontSize: 17, letterSpacing: 3 }}>
          {post.category}
        </div>
        <div
          style={{
            marginTop: 22,
            width: 1056,
            fontSize: post.title.length > 80 ? 54 : 72,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            lineClamp: 3,
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {post.title}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          bottom: 52,
          left: 64,
          right: 64,
          borderTop: '1px solid #41615a',
          paddingTop: 26,
          fontSize: 20,
        }}
      >
        <span>{post.author}</span>
        <span style={{ color: '#b4c7bf' }}>{post.date}</span>
      </div>
    </div>,
    { ...imageSize, fonts },
  );

  // Satori embeds glyph paths. No machine-specific system fonts are needed.
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
