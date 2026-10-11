import {describe, expect, it} from 'vitest';
import {createTimestamp} from './timestamp.ts';

describe('createTimestamp', () => {
  it('gives the milliseconds since the epoch', () => {
    const millisecondsBefore = Date.now();

    expect(createTimestamp()).toBeGreaterThanOrEqual(millisecondsBefore);
  });
});
