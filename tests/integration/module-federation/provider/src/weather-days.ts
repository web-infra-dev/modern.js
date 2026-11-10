export const forecastDays = ['Today', 'Wed', 'Thu', 'Fri', 'Sat'].map(
  (day, index) => ({
    id: day.toLowerCase(),
    day,
    high: 30 - index,
    low: 21 - index,
    rainy: index % 2 === 1,
  }),
);
export type ForecastDay = (typeof forecastDays)[number];
