import imageIco from './image.ico';
import imageJpeg from './image.jpeg';
import imagePng from './image.png';

const images = [imageIco, imagePng, imageJpeg];

for (const image of images) {
  const el = new Image();
  el.src = image;
  document.body.appendChild(el);
}
