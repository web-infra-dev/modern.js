import { Image } from '@modern-js/image/runtime';
import imgCrab from './crab.png?image';

export default function Page() {
  return <Image src={imgCrab} width={500} alt="crab" placeholder="blur" />;
}
