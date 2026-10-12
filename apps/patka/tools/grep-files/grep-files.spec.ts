import {tmpdir} from 'node:os';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {$} from 'zx';
import {some} from '../../option.ts';
import {success} from '../../try.ts';
import {GrepFiles} from './grep-files.ts';

vi.mock('zx', () => ({$: vi.fn()}));

describe('GrepFiles', () => {
  it('carries a manual for the model', () => {
    const grepFiles = new GrepFiles();

    expect(grepFiles.manual.name).toBe('grep_files');
  });

  it('asks for a pattern only', () => {
    const grepFiles = new GrepFiles();

    expect(grepFiles.manual.input.required).toEqual(['pattern']);
  });

  it('describes the two shapes of its output', () => {
    const grepFiles = new GrepFiles();

    expect(grepFiles.manual.output.oneOf).toHaveLength(2);
  });

  it('runs git grep on the working directory when no path is given', async () => {
    const template = vi.fn(
      (templateStringsArray: TemplateStringsArray, ...values: ReadonlyArray<string>) =>
        Promise.resolve({exitCode: 1, stdout: '', stderr: ''}),
    );
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect(String.raw(...template.mock.calls[0])).toBe(
      'git --literal-pathspecs -c color.ui=never grep --untracked -I -n -e needle -- .',
    );
  });

  it('runs git grep on the given path', async () => {
    const template = vi.fn(
      (templateStringsArray: TemplateStringsArray, ...values: ReadonlyArray<string>) =>
        Promise.resolve({exitCode: 1, stdout: '', stderr: ''}),
    );
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    await firstValueFrom(new GrepFiles().invoke({pattern: 'needle', relativePath: 'src/utils'}));

    expect(String.raw(...template.mock.calls[0])).toBe(
      'git --literal-pathspecs -c color.ui=never grep --untracked -I -n -e needle -- src/utils',
    );
  });

  it('runs git in the working directory without throwing on a non zero exit code', async () => {
    const template = vi.fn(() => Promise.resolve({exitCode: 1, stdout: '', stderr: ''}));
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect($).toHaveBeenCalledWith({cwd: process.cwd(), nothrow: true});
  });

  it('gives the lines that git finds', async () => {
    const template = vi.fn(() =>
      Promise.resolve({
        exitCode: 0,
        stdout: 'first.ts:1:export const needle = 1;\n',
        stderr: '',
      }),
    );
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    const matches = await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect(matches).toEqual(success(some('first.ts:1:export const needle = 1;\n')));
  });

  it('gives an empty text when git finds no match', async () => {
    const template = vi.fn(() => Promise.resolve({exitCode: 1, stdout: '', stderr: ''}));
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    const matches = await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect(matches).toEqual(success(some('')));
  });

  it('tells how many matches it does not show after 200 lines', async () => {
    const template = vi.fn(() =>
      Promise.resolve({exitCode: 0, stdout: 'many.ts:1:needle\n'.repeat(203), stderr: ''}),
    );
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    const matches = await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect(matches).toEqual(
      success(
        some(
          `${'many.ts:1:needle\n'.repeat(200)}3 more matches not shown. Use a narrower pattern or path.\n`,
        ),
      ),
    );
  });

  it('fails when git fails', async () => {
    const template = vi.fn(() =>
      Promise.resolve({exitCode: 128, stdout: '', stderr: 'fatal: not a git repository'}),
    );
    vi.mocked($)
      .mockReset()
      .mockReturnValue(template as never);

    const matches = await firstValueFrom(new GrepFiles().invoke({pattern: 'needle'}));

    expect(matches).toMatchObject({
      type: 'failure',
      error: {message: 'git grep failed: fatal: not a git repository'},
    });
  });

  it('refuses an absolute path', async () => {
    expect(
      await firstValueFrom(new GrepFiles().invoke({pattern: 'needle', relativePath: tmpdir()})),
    ).toMatchObject({
      type: 'failure',
      error: {message: expect.stringContaining('only accepts a relative path')},
    });
  });

  it('refuses a path outside the working directory', async () => {
    expect(
      await firstValueFrom(new GrepFiles().invoke({pattern: 'needle', relativePath: '../'})),
    ).toMatchObject({
      type: 'failure',
      error: {message: expect.stringContaining('only accepts a path inside the working directory')},
    });
  });

  it('does not run git until subscribed', () => {
    vi.mocked($).mockReset();

    new GrepFiles().invoke({pattern: 'needle'});

    expect($).not.toHaveBeenCalled();
  });
});
