import RemotePanel from './RemotePanel';

type AppProps = {
  basename?: string;
};

export default function App({ basename }: AppProps) {
  return <RemotePanel basename={basename} />;
}
