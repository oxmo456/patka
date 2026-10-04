import {randomUUID} from 'node:crypto';
import {of, Subject} from 'rxjs';
import {container, type DependencyContainer} from 'tsyringe';
import {describe, expect, it, vi} from 'vitest';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {PatkaContext} from './context/patka-context.ts';
import {PATKA_CONTEXT_ENTRIES} from './context/patka-context-entries.token.ts';
import type {PatkaContextEntry} from './context/patka-context-entry.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {Patka} from './patka.ts';
import {ListFiles} from './tools/list-files.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {ReadFile} from './tools/read-file.ts';
import {BLESSED} from './ui/blessed.token.ts';
import type {Blessed} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import type {PatkaUserInput} from './ui/patka-user-input.ts';
import {WORKING_DIRECTORY} from './working-directory.token.ts';

const aPatkaUI = (): PatkaUI => ({
  userInputs: of(),
  updateChat: vi.fn(),
  updateLogs: vi.fn(),
});

describe('Patka', () => {
  it('resolves the whole graph from the container', () => {
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {useValue: {generate: vi.fn()}});
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {useValue: aPatkaUI()});
    child.register(PATKA_CONTEXT_ENTRIES, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        dependencyContainer.resolve(PatkaContext).entries,
    });

    expect(child.resolve(Patka)).toBeInstanceOf(Patka);
  });

  it('answers what the user types', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {generate: () => of({content: 'Paris'})},
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {userInputs, updateChat: vi.fn(), updateLogs: vi.fn()},
    });
    child.register(PATKA_CONTEXT_ENTRIES, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        dependencyContainer.resolve(PatkaContext).entries,
    });
    child.resolve(Patka);
    const received: Array<PatkaContextEntry> = [];
    child
      .resolve(PatkaContext)
      .entries.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

    userInputs.next({content: 'capital of France?', timestamp: new Date(), id: randomUUID()});

    expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
      'PatkaUserUtterance',
      'PatkaInferenceClientResponse',
    ]);
  });

  it('stops answering once disposed', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {generate: () => of({content: 'Paris'})},
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {userInputs, updateChat: vi.fn(), updateLogs: vi.fn()},
    });
    child.register(PATKA_CONTEXT_ENTRIES, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        dependencyContainer.resolve(PatkaContext).entries,
    });
    const patka = child.resolve(Patka);
    const received: Array<PatkaContextEntry> = [];
    child.resolve(PatkaContext).entries.subscribe((entry) => received.push(entry));

    patka.dispose();
    userInputs.next({content: 'capital of France?', timestamp: new Date(), id: randomUUID()});

    expect(received).toEqual([]);
  });
});
