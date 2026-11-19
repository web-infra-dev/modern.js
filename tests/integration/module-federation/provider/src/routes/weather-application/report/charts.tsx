import { useEffect, useRef, useState, useId } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  PolarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { ReportModel } from './report-model';

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  GridComponent,
  LegendComponent,
  PolarComponent,
  TooltipComponent,
  VisualMapComponent,
  SVGRenderer,
]);
const WIDTH = 640,
  HEIGHT = 280;
type Option = echarts.EChartsCoreOption;

function renderSVG(option: Option) {
  const chart = echarts.init(null, undefined, {
    renderer: 'svg',
    ssr: true,
    width: WIDTH,
    height: HEIGHT,
  });
  try {
    chart.setOption(option);
    // Preserve the server viewBox while its responsive client renderer loads.
    const svg = chart.renderToSVGString();
    return svg.includes('viewBox=')
      ? svg
      : svg.replace('<svg ', `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" `);
  } finally {
    chart.dispose();
  }
}

function Chart({
  id,
  title,
  detail,
  option,
}: {
  id: string;
  title: string;
  detail: string;
  option: Option;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | undefined>(undefined);
  const chartID = `weather-report-chart-${useId()}`;
  // ECharts owns the SVG subtree. During hydration reuse the exact server SVG,
  // including generated ids, until the normal browser renderer takes over.
  const [initialSVG] = useState(() =>
    typeof window === 'undefined'
      ? renderSVG(option)
      : document.getElementById(chartID)?.innerHTML || '',
  );
  const [applied, setApplied] = useState<Option>();
  useEffect(() => {
    const root = element.current!;
    // Full ECharts appends its renderer, so remove the static SSR SVG at the
    // synchronous handoff rather than leaving two charts in the container.
    root.replaceChildren();
    const chart = echarts.init(root, undefined, {
      renderer: 'svg',
      height: HEIGHT,
    });
    instance.current = chart;
    const resize = new ResizeObserver(() =>
      chart.resize({ width: root.clientWidth, height: HEIGHT }),
    );
    resize.observe(root);
    return () => {
      resize.disconnect();
      instance.current = undefined;
      chart.dispose();
    };
  }, []);
  useEffect(() => {
    instance.current?.setOption(option, { notMerge: true });
    setApplied(option);
  }, [option]);
  return (
    <section
      className="report-chart"
      data-report-chart={id}
      data-chart-ready={applied === option ? 'true' : 'false'}
    >
      <header>
        <h3>{title}</h3>
        <p>{detail}</p>
      </header>
      <div
        id={chartID}
        ref={element}
        className="report-echart"
        role="img"
        aria-label={title}
        data-server-chart={initialSVG ? 'true' : 'false'}
        dangerouslySetInnerHTML={{ __html: initialSVG }}
      />
    </section>
  );
}

export function ReportCharts({ options }: { options: ReportModel['charts'] }) {
  return (
    <div className="report-charts">
      {options.map(chart => (
        <Chart key={chart.id} {...chart} />
      ))}
    </div>
  );
}
