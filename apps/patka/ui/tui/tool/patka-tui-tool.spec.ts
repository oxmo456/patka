import {firstValueFrom, lastValueFrom, of, toArray} from 'rxjs';
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
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
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
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    await lastValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'show_logs'}), {
      defaultValue: undefined,
    });

    expect(patkaUI.showLogs).toHaveBeenCalledTimes(1);
  });

  it('hides the log panel on the hide_logs command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    await lastValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'hide_logs'}), {
      defaultValue: undefined,
    });

    expect(patkaUI.hideLogs).toHaveBeenCalledTimes(1);
  });

  it('shows the inference client chat panel on the show_inference_client_chat command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    await lastValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'show_inference_client_chat'}), {
      defaultValue: undefined,
    });

    expect(patkaUI.showInferenceClientChat).toHaveBeenCalledTimes(1);
  });

  it('hides the inference client chat panel on the hide_inference_client_chat command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    await lastValueFrom(new PatkaTUITool(patkaUI).invoke({command: 'hide_inference_client_chat'}), {
      defaultValue: undefined,
    });

    expect(patkaUI.hideInferenceClientChat).toHaveBeenCalledTimes(1);
  });

  it('completes without output on the show_logs command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    const outputs = await firstValueFrom(
      new PatkaTUITool(patkaUI).invoke({command: 'show_logs'}).pipe(toArray()),
    );

    expect(outputs).toEqual([]);
  });

  it('fails on an unknown command', async () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    await expect(
      firstValueFrom(
        new PatkaTUITool(patkaUI).invoke({command: 'dance'} as unknown as PatkaTUIToolInput),
      ),
    ).rejects.toThrow('Unknown command: dance');
  });

  it('does not touch the UI until subscribed', () => {
    const patkaUI: PatkaUI = {
      userInputs: of(),
      updateChat: vi.fn(),
      updateLogs: vi.fn(),
      showLogs: vi.fn(),
      hideLogs: vi.fn(),
      updateInferenceClientChat: vi.fn(),
      showInferenceClientChat: vi.fn(),
      hideInferenceClientChat: vi.fn(),
    };

    new PatkaTUITool(patkaUI).invoke({command: 'show_logs'});

    expect(patkaUI.showLogs).not.toHaveBeenCalled();
  });
});
