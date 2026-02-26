export async function AsyncRemoteServerInfo() {
  const value = await Promise.resolve('remote-async-server-info-ok');

  return <p className="remote-async-server-info">{value}</p>;
}
