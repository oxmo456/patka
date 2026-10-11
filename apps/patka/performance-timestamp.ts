export type PerformanceTimestamp = number;

export function createPerformanceTimestamp(): PerformanceTimestamp {
  return performance.now();
}
