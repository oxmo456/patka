import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {ClaudeInferenceClient} from './claude-inference-client.ts';

describe('ClaudeInferenceClient', () => {
  it('emits what the command printed', async () => {
    const claudeInferenceClient = new ClaudeInferenceClient('echo');

    const response = await firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'}));

    expect(response.content).toContain('hello');
  });

  it('errors when the command cannot be run', async () => {
    const claudeInferenceClient = new ClaudeInferenceClient('this-command-does-not-exist');

    await expect(
      firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'})),
    ).rejects.toThrow();
  });

  it('errors when the command fails', async () => {
    const claudeInferenceClient = new ClaudeInferenceClient('false');

    await expect(firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'}))).rejects.toThrow(
      'exited with code 1',
    );
  });
});
