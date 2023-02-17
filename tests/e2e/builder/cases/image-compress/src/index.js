import imageIco from './image.ico?url';
import imagePng from './image.png?url';
import imageJpeg from './image.jpeg?url';
import imageSvg from './image.svg?url';

const images = [imageIco, imagePng, imageJpeg, imageSvg];

for (const image of images) {
  const el = new Image();
  el.src = image;
  document.body.appendChild(el);
}
