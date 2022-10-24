/**
 * Make the progress percentage more user friendly.
 * The original percentage may pause at certain number for a long time,
 * or decrease in some cases, which will confuse the user.
 * So we format the percentage number and display a more smooth percentage.
 */
export const createFriendlyPercentage = () => {
  let prevPercentage = 0;

  return (percentage: number) => {
    if (percentage === 0 || percentage === 1) {
      prevPercentage = 0;
      return percentage;
    }

    if (percentage <= prevPercentage) {
      let step = 0;
      if (prevPercentage < 0.3) {
        step = 0.001;
      } else if (prevPercentage < 0.6) {
        step = 0.002;
      } else if (prevPercentage < 0.8) {
        step = 0.004;
      } else if (prevPercentage < 0.99) {
        step = 0.002;
      }

      prevPercentage += step;
      return prevPercentage;
    }

    prevPercentage = percentage;
    return percentage;
  };
};
