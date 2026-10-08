import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {none} from '../../option.ts';
import {success} from '../../try.ts';
import {ReportIncompetency} from './report-incompetency.ts';

describe('ReportIncompetency', () => {
  it('carries the name the model must invoke', () => {
    const reportIncompetency = new ReportIncompetency();

    expect(reportIncompetency.manual.name).toBe('report_incompetency');
  });

  it('gives an empty success as output', async () => {
    const reportIncompetency = new ReportIncompetency();

    const output = await firstValueFrom(reportIncompetency.invoke());

    expect(output).toEqual(success(none));
  });
});
