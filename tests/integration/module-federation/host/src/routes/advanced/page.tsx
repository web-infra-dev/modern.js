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
          <h1>Weather experiments</h1>
          <p>Remote replacement, data recovery and loader lifecycle.</p>
        </div>
        <select
          aria-label="Advanced scenarios"
          value={scenario}
          onChange={event => setScenario(event.target.value as typeof scenario)}
        >
          <option value="replace">Remote replacement</option>
          <option value="recovery">Data recovery</option>
          <option value="lifecycle">Data lifecycle</option>
        </select>
      </header>
      <iframe
        key={scenario}
        className="advanced-frame"
        title="Advanced weather experiment"
        src={`/${scenario}?embedded=1`}
      />
    </div>
  );
}
