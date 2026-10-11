export type Timestamp = number;

export type PerformanceTimestamp = number;

export function createTimestamp(): Timestamp {
  return Date.now();
}

export function createPerformanceTimestamp(): PerformanceTimestamp {
  return performance.now();
}
