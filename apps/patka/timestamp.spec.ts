import {describe, expect, it} from 'vitest';
import {createPerformanceTimestamp, createTimestamp} from './timestamp.ts';

describe('createTimestamp', () => {
  it('gives the milliseconds since the epoch', () => {
    const millisecondsBefore = Date.now();

    expect(createTimestamp()).toBeGreaterThanOrEqual(millisecondsBefore);
  });
});

describe('createPerformanceTimestamp', () => {
  it('gives the milliseconds since the process started', () => {
    const millisecondsBefore = performance.now();

    expect(createPerformanceTimestamp()).toBeGreaterThanOrEqual(millisecondsBefore);
  });
});
