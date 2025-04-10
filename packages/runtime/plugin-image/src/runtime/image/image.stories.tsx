import type { ImageLoader, ImageProps } from '@/types/image';
import type { Meta, StoryObj } from '@storybook/react';
import type { PropsWithChildren } from 'react';
import imgMountains from '../../../tests/fixtures/images/large.jpg?image';
import { Image } from './image';
import { resolveImageProps } from './props';

const random = () => Math.random().toString(36).substring(2, 15);

const generateRandomSVGThumbnail = (width: number, height: number) => {
  // 使用 HSL 生成低饱和度的颜色
  // hue: 0-360, saturation: 0-10%, lightness: 60-80%
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 10); // 低饱和度 0-10%
  const lightness = Math.floor(Math.random() * 20) + 60; // 适中亮度 60-80%
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // 为圆形生成对比色
  const contrastLightness = lightness > 70 ? lightness - 30 : lightness + 30;
  const contrastColor = `hsl(${hue}, ${saturation}%, ${contrastLightness}%)`;

  // 创建基础SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}"
        fill="${contrastColor}"
        opacity="0.5" />
    </svg>
  `;

  // 转换为data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getRemoteImageModule = (
  width = 500,
  height = 300,
  id = Math.floor(Math.random() * 1000) + 1,
) => ({
  url: `https://picsum.photos/id/${id}/${width}/${height}`,
  width,
  height,
  thumbnail: {
    url: generateRandomSVGThumbnail(8, 8),
    width: 8,
    height: 8,
  },
});

function Renderer(props: ImageProps) {
  return (
    <div style={{ border: '1px solid #8883', borderRadius: 7, padding: 10 }}>
      <Image {...props} />
    </div>
  );
}

const meta: Meta<typeof Image> = {
  title: 'Image',
  component: Image,
  parameters: {
    layout: 'centered',
  },
  render: Renderer,
  tags: ['autodocs'],
  argTypes: {
    alt: { type: 'string' },
    densities: { control: 'object' },
    fill: { type: 'boolean' },
    width: { type: 'number' },
    height: { type: 'number' },
    loader: { type: 'function' },
    loading: { control: 'select', options: ['lazy', 'eager'] },
    overrideSrc: { type: 'string' },
    placeholder: { control: 'select', options: ['blur', false] },
    priority: { type: 'boolean' },
    quality: { type: 'number' },
    sizes: { type: 'string' },
    src: { control: 'object' },
    style: { control: 'object' },
    unoptimized: { type: 'boolean' },
    onError: { type: 'function' },
    onLoad: { type: 'function' },
    onLoadingComplete: { type: 'function' },
  },
  args: {
    ...resolveImageProps({ src: getRemoteImageModule() }),
  },
};

export default meta;

type Story = StoryObj<typeof Image>;

const imageLoader: ImageLoader = ({ src, quality, width }) => {
  return `${src}?w=${width}&q=${quality}&${random()}`;
};

export const Default: Story = {
  args: {
    src: imgMountains,
    loader: imageLoader,
  },
};

export const BlurThumbnail: Story = {
  args: {
    src: imgMountains,
    loader: imageLoader,
    placeholder: 'blur',
  },
};
