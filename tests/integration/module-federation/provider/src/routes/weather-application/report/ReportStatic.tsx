export function ReportHeading() {
  return (
    <header className="report-heading">
      <p>OBSERVATORY / JUNE 2026</p>
      <h2>Hangzhou climate review</h2>
      <span>Illustrative observations · 24 stations · 30 days</span>
    </header>
  );
}

export function ReportMethod() {
  return (
    <section className="report-method" data-report-complete>
      <h3>Reading this report</h3>
      <p>
        The temperature comparison separates the daily cycle from the seasonal
        reference. Rainfall and probability use distinct scales; a high
        probability does not imply a high rainfall total. Air concentrations are
        stacked by pollutant for visual composition, not as a combined
        air-quality index.
      </p>
      <p>
        Station rankings summarize the selected period. The heat calendar
        retains every hourly reading, while the wind rose groups observations
        into sixteen compass sectors. Missing station matches do not change the
        underlying charts.
      </p>
      <small>
        Deterministic fixture data for rendering comparisons. Not for weather or
        health decisions.
      </small>
    </section>
  );
}
