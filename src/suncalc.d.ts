declare module 'suncalc' {
  export interface GetTimesResult {
    sunrise: Date;
    sunset: Date;
    [key: string]: Date;
  }

  export function getTimes(
    date: Date,
    latitude: number,
    longitude: number
  ): GetTimesResult;
}
