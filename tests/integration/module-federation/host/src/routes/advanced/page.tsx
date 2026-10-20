import { useState } from 'react';
import { LabNav } from '../../components/Comparison';
export default function Page() {
  const [scenario, setScenario] = useState<
    'recovery' | 'lifecycle' | 'replace'
  >('replace');
  return (
    <div className="advanced-shell">
      <LabNav />
      <header className="comparison-intro">
        <div>
          <span>WEATHER / ADVANCED</span>
          <h1>天气站的进阶实验</h1>
          <p>远程版本替换、数据恢复和数据加载生命周期。</p>
        </div>
        <select
          aria-label="进阶场景"
          value={scenario}
          onChange={event => setScenario(event.target.value as typeof scenario)}
        >
          <option value="replace">天气版本替换</option>
          <option value="recovery">数据恢复</option>
          <option value="lifecycle">数据生命周期</option>
        </select>
      </header>
      <iframe
        key={scenario}
        className="advanced-frame"
        title="进阶天气实验"
        src={`/${scenario}?embedded=1`}
      />
    </div>
  );
}
