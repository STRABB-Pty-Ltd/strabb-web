// Display convention for the api's occupancy contract: occupancy_rate is a
// decimal in 0..1 at 4 dp (= 2 dp as a percent), shown in the UI as a whole
// percent. One helper so the conversion cannot drift across surfaces.
export function occupancyRateToPercent(rate: number): number {
  return Math.round(rate * 100);
}
