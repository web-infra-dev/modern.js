'use client';

import { useLoaderData } from '@modern-js/runtime/router';
import styles from './page.module.css';

export default function Page() {
  const loaderData = useLoaderData() as string;
  return <div className={`${styles.rootPage} root-page`}>{loaderData}</div>;
}
