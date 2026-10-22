import {firstValueFrom, toArray} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {defaultPatkaDictionary, PatkaText} from '../../patka-text/patka-text.ts';
import {ReportIncompetency} from './report-incompetency.ts';

describe('ReportIncompetency', () => {
  it('carries the name the model must invoke', () => {
    const reportIncompetency = new ReportIncompetency(new PatkaText(defaultPatkaDictionary));

    expect(reportIncompetency.name).toBe('report_incompetency');
  });

  it('completes without output', async () => {
    const reportIncompetency = new ReportIncompetency(new PatkaText(defaultPatkaDictionary));

    const outputs = await firstValueFrom(reportIncompetency.invoke().pipe(toArray()));

    expect(outputs).toEqual([]);
  });
});
