import {randomUUID} from 'node:crypto';
import {of, Subject} from 'rxjs';
import {container, type DependencyContainer} from 'tsyringe';
import {describe, expect, it, vi} from 'vitest';
import {some} from '../../packages/option/option.ts';
import type {PatkaContextEntry} from '../../packages/patka-agent/context/patka-context-entry.ts';
import {PatkaAgent} from '../../packages/patka-agent/patka-agent.ts';
import {PatkaTools} from '../../packages/patka-agent/tools/patka-tools.ts';
import {PatkaLogger} from '../../packages/patka-logger/patka-logger.ts';
import {DefaultPatkaPromptFactory} from '../../packages/patka-prompt/default-patka-prompt-factory.ts';
import {ListFiles} from '../../packages/patka-tools/list-files/list-files.ts';
import {ReadFile} from '../../packages/patka-tools/read-file/read-file.ts';
import {WORKING_DIRECTORY} from '../../packages/working-directory/working-directory.token.ts';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {createPatkaAgentFromDependencyContainer} from './agent/patka-agent-factory.ts';
import {PatkaContext} from './context/patka-context.ts';
import {PATKA_CONTEXT_ENTRIES} from './context/patka-context-entries.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {Patka} from './patka.ts';
import {PATKA_PROMPT_DIRECTIVE} from './prompt/patka-prompt-directive.token.ts';
import {createPatkaPromptDirective} from './prompt/patka-prompt-directives.ts';
import {PATKA_PROMPT_FACTORY} from './prompt/patka-prompt-factory.token.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {createPatkaToolsFromDependencyContainer} from './tools/patka-tools-factory.ts';
import {BLESSED} from './ui/blessed.token.ts';
import type {Blessed} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import type {PatkaUserInput} from './ui/patka-user-input.ts';

const aPatkaUI = (): PatkaUI => ({
  userInputs: of(),
  updateChat: vi.fn(),
  updateLogs: vi.fn(),
});

describe('Patka', () => {
  it('resolves the whole graph from the container', () => {
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(PATKA_PROMPT_DIRECTIVE, {
      useValue: createPatkaPromptDirective(),
    });
    child.register(PATKA_PROMPT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultPatkaPromptFactory(
          dependencyContainer.resolve(PatkaTools),
          dependencyContainer.resolve(WORKING_DIRECTORY),
          dependencyContainer.resolve(PATKA_PROMPT_DIRECTIVE),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
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
    child.register(PATKA_PROMPT_DIRECTIVE, {
      useValue: createPatkaPromptDirective(),
    });
    child.register(PATKA_PROMPT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultPatkaPromptFactory(
          dependencyContainer.resolve(PatkaTools),
          dependencyContainer.resolve(WORKING_DIRECTORY),
          dependencyContainer.resolve(PATKA_PROMPT_DIRECTIVE),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {generate: () => of({content: 'Paris', usage: {inputTokens: 0, outputTokens: 0}})},
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

  it('gives the answer what the user said as root', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(PATKA_PROMPT_DIRECTIVE, {
      useValue: createPatkaPromptDirective(),
    });
    child.register(PATKA_PROMPT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultPatkaPromptFactory(
          dependencyContainer.resolve(PatkaTools),
          dependencyContainer.resolve(WORKING_DIRECTORY),
          dependencyContainer.resolve(PATKA_PROMPT_DIRECTIVE),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {generate: () => of({content: 'Paris', usage: {inputTokens: 0, outputTokens: 0}})},
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

    expect(received[1]).toMatchObject({root: some(received[0]?.id)});
  });

  it('stops answering once disposed', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(PATKA_PROMPT_DIRECTIVE, {
      useValue: createPatkaPromptDirective(),
    });
    child.register(PATKA_PROMPT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultPatkaPromptFactory(
          dependencyContainer.resolve(PatkaTools),
          dependencyContainer.resolve(WORKING_DIRECTORY),
          dependencyContainer.resolve(PATKA_PROMPT_DIRECTIVE),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {generate: () => of({content: 'Paris', usage: {inputTokens: 0, outputTokens: 0}})},
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
