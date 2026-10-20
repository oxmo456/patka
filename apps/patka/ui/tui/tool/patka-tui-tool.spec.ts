import {firstValueFrom, of} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {PatkaUI} from '../../patka-ui.ts';
import {PatkaTUITool, type PatkaTUIToolInput} from './patka-tui-tool.ts';

describe('PatkaTUITool', () => {
  it('is named patka_tui', () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    expect(new PatkaTUITool(patkaUI).name).toBe('patka_tui');
  });

  it('shows the log panel on the show_logs command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    await firstValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'show_logs'}));

    expect(patkaUI.showLogs).toHaveBeenCalledTimes(1);
  });

  it('hides the log panel on the hide_logs command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    await firstValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'hide_logs'}));

    expect(patkaUI.hideLogs).toHaveBeenCalledTimes(1);
  });

  it('emits a success on the show_logs command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    expect(await firstValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'show_logs'}))).toEqual({
      type: 'success',
      value: {type: 'some', value: 'The log panel is visible.'},
    });
  });

  it('fails on an unknown command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    expect(
      await firstValueFrom(
        new PatkaTUITool(patkaUI).invoke({command: 'dance'} as unknown as PatkaTUIToolInput),
      ),
    ).toMatchObject({type: 'failure'});
  });

  it('does not touch the UI until subscribed', () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
    };

    new PatkaTUITool(patkaUI).invoke({command: 'show_logs'});

    expect(patkaUI.showLogs).not.toHaveBeenCalled();
  });
});
