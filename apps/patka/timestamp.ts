export type Timestamp = number;

export function createTimestamp(): Timestamp {
  return Date.now();
}
