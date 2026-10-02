import {firstValueFrom, toArray} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {ReportIncompetency} from './report-incompetency.ts';

describe('ReportIncompetency', () => {
  it('carries the name the model must invoke', () => {
    const reportIncompetency = new ReportIncompetency();

    expect(reportIncompetency.manual.name).toBe('report_incompetency');
  });

  it('gives no output', async () => {
    const reportIncompetency = new ReportIncompetency();

    const outputs = await firstValueFrom(reportIncompetency.invoke().pipe(toArray()));

    expect(outputs).toEqual([]);
  });
});
