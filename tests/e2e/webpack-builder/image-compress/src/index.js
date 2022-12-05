import imageIco from './image.ico';
import imagePng from './image.png';
import imageJpeg from './image.jpeg';

const images = [imageIco, imagePng, imageJpeg];

for (const image of images) {
  const el = new Image();
  el.src = image;
  document.body.appendChild(el);
}
