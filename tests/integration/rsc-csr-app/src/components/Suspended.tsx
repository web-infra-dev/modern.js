async function Suspended() {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return <div>Suspended</div>;
}

export default Suspended;
