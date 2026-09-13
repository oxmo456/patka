import {of} from 'rxjs';
import {container} from 'tsyringe';
import {describe, expect, it, vi} from 'vitest';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {Patka} from './patka.ts';
import {ListFiles} from './tools/list-files.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {ReadFile} from './tools/read-file.ts';
import {BLESSED} from './ui/blessed.token.ts';
import type {Blessed} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';

const aPatkaUI = (): PatkaUI => ({
  userInputs: of(),
  updateChat: vi.fn(),
  updateLogs: vi.fn(),
});

describe('Patka', () => {
  it('resolves the whole graph from the container', () => {
    const child = container.createChildContainer();
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {useValue: {generate: vi.fn()}});
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {useValue: aPatkaUI()});

    expect(child.resolve(Patka)).toBeInstanceOf(Patka);
  });
});
