import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {ClaudeInferenceClient} from './claude-inference-client.ts';

describe('ClaudeInferenceClient', () => {
  it('emits the result the command printed', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'patka-claude-'));
    const command = join(directory, 'claude');
    await writeFile(
      command,
      `#!/bin/sh\necho '{"result":" world ","usage":{"input_tokens":3,"output_tokens":5}}'\n`,
      {mode: 0o755},
    );
    const claudeInferenceClient = new ClaudeInferenceClient(command);

    const response = await firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'}));

    expect(response.content).toBe('world');
  });

  it('gives the tokens sent and received', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'patka-claude-'));
    const command = join(directory, 'claude');
    await writeFile(
      command,
      `#!/bin/sh\necho '{"result":"world","usage":{"input_tokens":3,"output_tokens":5}}'\n`,
      {mode: 0o755},
    );
    const claudeInferenceClient = new ClaudeInferenceClient(command);

    const response = await firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'}));

    expect(response.usage).toEqual({inputTokens: 3, outputTokens: 5});
  });

  it('errors when the command does not print json', async () => {
    const claudeInferenceClient = new ClaudeInferenceClient('echo');

    await expect(
      firstValueFrom(claudeInferenceClient.generate({prompt: 'hello'})),
    ).rejects.toThrow();
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
