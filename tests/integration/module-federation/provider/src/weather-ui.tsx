import { useEffect, useState } from 'react';
export type WeatherData = {
  temperature: number;
  condition: string;
  source: string;
  requestId: number;
};
export const fixture: WeatherData = {
  temperature: 30,
  condition: '局部多云',
  source: '本地预置天气',
  requestId: 0,
};
export function report(event: string) {
  if (typeof window !== 'undefined')
    window.parent.postMessage(
      { type: 'mf-weather', event, at: Math.round(performance.now()) },
      window.location.origin,
    );
}
export function WeatherIcon({ rainy = false }: { rainy?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className="weather-icon"
      aria-label={rainy ? '阵雨' : '局部多云'}
    >
      <g fill="#ffdb69">
        <circle cx="42" cy="17" r="10" />
        <path
          stroke="#ffdb69"
          strokeWidth="2"
          d="M42 1v4m0 24v4M26 17h4m24 0h5M30 5l3 3m18 18 3 3M30 29l3-3M51 8l3-3"
        />
      </g>
      <path
        fill="#fff"
        d="M14 36a9 9 0 0 1-1-18 13 13 0 0 1 25-1 10 10 0 0 1 5 19Z"
      />
      {rainy && (
        <path
          d="m18 40-3 6m14-6-3 6m14-6-3 6"
          stroke="#79dcff"
          strokeWidth="3"
        />
      )}
    </svg>
  );
}
export function CurrentWeather({
  mfData,
  local = false,
}: {
  mfData?: WeatherData;
  local?: boolean;
}) {
  const [data, setData] = useState(local ? fixture : mfData);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setReady(true);
    report('客户端已接管');
    if (!local && !mfData) {
      fetch(`${process.env.MF_LAB_API}/weather`)
        .then(response => {
          if (!response.ok) throw new Error('天气接口异常');
          return response.json();
        })
        .then(setData)
        .catch(() => report('数据请求失败'));
    }
  }, []);
  useEffect(() => {
    if (data) report('天气数据已显示');
  }, [data]);
  return (
    <section
      className="current-weather"
      data-testid="weather-current"
      data-source={data?.source || 'pending'}
    >
      <span className="location-label">⌖ 我的位置</span>
      <h1>余杭区</h1>
      <div className="current-temperature">
        {data ? data.temperature : '—'}
        <sup>°</sup>
      </div>
      <p>{data?.condition || '等待天气数据'}</p>
      <p>最高 30° · 最低 21°</p>
      <button
        className="weather-save"
        disabled={!ready || !data}
        onClick={() => {
          setSaved(!saved);
          report('交互已验证');
        }}
        data-testid="weather-save"
      >
        {saved ? '♥ 已收藏天气站' : '♡ 收藏天气站'}
      </button>
      <small className="weather-source">
        {data?.source || '尚未获取数据'}
        {data?.requestId ? ` · 请求 #${data.requestId}` : ''}
      </small>
    </section>
  );
}
export function HourlyWeather() {
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section
      className="weather-card hourly-weather"
      data-testid="weather-hourly"
    >
      <h2>
        ◷ 每小时天气预报 <small>动态远程 · Rslib</small>
      </h2>
      <div className="hours">
        {[30, 29, 28, 27, 26, 25, 24, 23].map((temperature, index) => (
          <button
            key={temperature}
            disabled={!ready}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index);
              report('交互已验证');
            }}
          >
            <span>{index === 0 ? '现在' : `${index + 14}时`}</span>
            <WeatherIcon rainy={index > 4} />
            <b>{temperature}°</b>
          </button>
        ))}
      </div>
      <p className="card-caption">
        {selected === 0 ? '现在' : `${selected + 14}时`} · {30 - selected}
        °，傍晚有短时阵雨。
      </p>
    </section>
  );
}
export function DaysWeather() {
  return (
    <section className="weather-card days-weather" data-testid="weather-days">
      <h2>
        ▦ 未来五天天气 <small>静态嵌套 · Modern</small>
      </h2>
      {['今天', '周三', '周四', '周五', '周六'].map((day, index) => (
        <div className="day-row" key={day}>
          <b>{day}</b>
          <WeatherIcon rainy={index % 2 === 1} />
          <span>{21 - index}°</span>
          <div className="temperature-track">
            <i
              style={{
                marginLeft: `${index * 7}%`,
                width: `${75 - index * 8}%`,
              }}
            />
          </div>
          <strong>{30 - index}°</strong>
        </div>
      ))}
    </section>
  );
}
export function WindWeather() {
  const [angle, setAngle] = useState(340);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section className="weather-card wind-weather" data-testid="weather-wind">
      <h2>
        〰 风 <small>动态嵌套 · Rslib</small>
      </h2>
      <div className="wind-body">
        <div>
          <p>
            风速 <b>4 公里/小时</b>
          </p>
          <p>
            阵风 <b>9 公里/小时</b>
          </p>
          <p>
            方向 <b data-testid="wind-angle">{angle}°</b>
          </p>
        </div>
        <div className="compass">
          <span>北</span>
          <i style={{ transform: `rotate(${angle}deg)` }}>↑</i>
          <strong>
            4<small>公里/小时</small>
          </strong>
          <span>南</span>
        </div>
      </div>
      <label className="wind-control">
        {verified
          ? '✓ 交互已验证'
          : ready
            ? '拖动滑块，改变风向'
            : '等待客户端接管'}
        <input
          aria-label="调整风向"
          type="range"
          min="0"
          max="360"
          value={angle}
          disabled={!ready}
          onChange={event => {
            setAngle(Number(event.target.value));
            setVerified(true);
            report('交互已验证');
          }}
        />
      </label>
    </section>
  );
}
