const wait = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

export default async function loader() {
  await wait(200);
  return 'request profile layout';
}
