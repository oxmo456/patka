import {describe, expect, it} from 'vitest';
import {createPerformanceTimestamp} from './performance-timestamp.ts';

describe('createPerformanceTimestamp', () => {
  it('gives the milliseconds since the process started', () => {
    const millisecondsBefore = performance.now();

    expect(createPerformanceTimestamp()).toBeGreaterThanOrEqual(millisecondsBefore);
  });
});
