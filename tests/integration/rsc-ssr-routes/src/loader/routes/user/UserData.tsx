import { use } from 'react';

export default function UserData({ userData }: { userData: Promise<any> }) {
  const value = use(userData);
  return <div className="user-data">{value}</div>;
}
