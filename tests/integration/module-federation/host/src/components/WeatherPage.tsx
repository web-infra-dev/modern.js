import { useSearchParams } from '@modern-js/runtime/router';
import {
  getInstance,
  loadRemote,
} from '@module-federation/modern-js-v3/runtime';
import './remotes';
import type { WeatherData } from '../../../provider/src/weather-ui';
type Current = {
  default: (props: {
    local?: boolean;
    mfData?: WeatherData;
  }) => React.JSX.Element;
};
const runtime = getInstance()!;
const options = {
  loading: <div className="weather-wait">正在连接天气站…</div>,
  fallback: <p role="alert">天气站连接失败</p>,
};
async function remote<T>(name: string) {
  const module = await loadRemote<T>(name);
  if (!module) throw new Error(name);
  return module;
}
const Current = runtime.createLazyComponent({
  ...options,
  loader: () => remote<Current>('provider/Weather'),
});
const Data = runtime.createLazyComponent({
  ...options,
  loader: () => remote<Current>('provider/WeatherData'),
});
const ClientData = runtime.createLazyComponent({
  ...options,
  noSSR: true,
  loader: () => remote<Current>('provider/WeatherData'),
});
const Hourly = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('dynamic/WeatherHourly'),
});
const Days = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('nested/WeatherDays'),
});
const Wind = runtime.createLazyComponent({
  ...options,
  loader: () =>
    remote<{ default: () => React.JSX.Element }>('dynamicNested/WeatherWind'),
});
export default function WeatherPage() {
  const [params] = useSearchParams();
  const compact = params.get('compact') === '1';
  const local = params.get('data') === 'local';
  return (
    <main className={`weather-scene ${compact ? 'compact' : ''}`}>
      <div className="sky-cloud cloud-one" />
      <div className="sky-cloud cloud-two" />
      <div className="weather-content">
        {params.get('data') === 'mf' ? (
          params.get('render') === 'csr' ? (
            <ClientData />
          ) : (
            <Data />
          )
        ) : (
          <Current local={local} />
        )}
        <div className="weather-grid">
          <Hourly />
          {!compact && (
            <>
              <Days />
              <Wind />
              <section className="weather-card air-weather">
                <h2>◌ 空气质量</h2>
                <strong>49</strong>
                <p>优</p>
                <div className="air-scale" />
                <small>当前 AQI (CN) 为 49。</small>
              </section>
              <section className="weather-card uv-weather">
                <h2>☀ 紫外线指数</h2>
                <strong>3</strong>
                <p>中等</p>
                <div className="air-scale" />
                <small>下午出门时注意防晒。</small>
              </section>
              <section className="weather-card sunset-weather">
                <h2>☼ 日落</h2>
                <strong>17:24</strong>
                <svg viewBox="0 0 200 60" aria-hidden="true">
                  <path
                    d="M0 55Q100 -45 200 55"
                    fill="none"
                    stroke="#9edaff"
                    strokeWidth="4"
                  />
                  <path d="M0 40h200" stroke="#b9e6ff" />
                  <circle cx="128" cy="13" r="5" fill="white" />
                </svg>
                <small>日出：上午 6:05</small>
              </section>
            </>
          )}
        </div>
        <div className="weather-credit">
          本地模拟天气 · 杭州余杭 ·{' '}
          {compact ? '' : '静态 / 动态 / 嵌套远程组件'}
        </div>
      </div>
    </main>
  );
}
