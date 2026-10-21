import {randomUUID} from 'node:crypto';
import {of, Subject} from 'rxjs';
import {container, type DependencyContainer} from 'tsyringe';
import {describe, expect, it, vi} from 'vitest';
import {none, some} from '../../packages/option/option.ts';
import {PatkaAgent} from '../../packages/patka-agent/patka-agent.ts';
import type {PatkaContextEntry} from '../../packages/patka-context/patka-context-entry.ts';
import {PatkaLogger} from '../../packages/patka-logger/patka-logger.ts';
import {DefaultInferenceClientChatInputFactory} from '../../packages/patka-prompt/default-inference-client-chat-input-factory.ts';
import {PatkaTools} from '../../packages/patka-tool/patka-tools.ts';
import {ListFiles} from '../../packages/patka-tools/list-files/list-files.ts';
import {ReadFile} from '../../packages/patka-tools/read-file/read-file.ts';
import {WORKING_DIRECTORY} from '../../packages/working-directory/working-directory.token.ts';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {createPatkaAgentFromDependencyContainer} from './agent/patka-agent-factory.ts';
import {PatkaContext} from './context/patka-context.ts';
import {PATKA_CONTEXT_ENTRIES} from './context/patka-context-entries.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {Patka} from './patka.ts';
import {INFERENCE_CLIENT_CHAT_INPUT_FACTORY} from './prompt/inference-client-chat-input-factory.token.ts';
import {createTextFromPatkaTextKey} from './text/patka-text.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {createPatkaToolsFromDependencyContainer} from './tools/patka-tools-factory.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import type {PatkaUserInput} from './ui/patka-user-input.ts';
import {BLESSED} from './ui/tui/blessed.token.ts';
import type {Blessed} from './ui/tui/patka-tui.ts';

const aPatkaUI = (): PatkaUI => ({
  userInputs: of(),
  updateChat: vi.fn(),
  updateLogs: vi.fn(),
  showLogs: vi.fn(),
  hideLogs: vi.fn(),
  updateInferenceClientChat: vi.fn(),
  showInferenceClientChat: vi.fn(),
  hideInferenceClientChat: vi.fn(),
});

describe('Patka', () => {
  it('resolves the whole graph from the container', () => {
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultInferenceClientChatInputFactory(
          dependencyContainer.resolve(PatkaTools),
          createTextFromPatkaTextKey('prompt.system', {
            workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
          }),
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
    child.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultInferenceClientChatInputFactory(
          dependencyContainer.resolve(PatkaTools),
          createTextFromPatkaTextKey('prompt.system', {
            workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
          }),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {
        generate: () =>
          of({content: 'Paris', toolCall: none, usage: {inputTokens: 0, outputTokens: 0}}),
      },
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {
        userInputs,
        updateChat: vi.fn(),
        updateLogs: vi.fn(),
        showLogs: vi.fn(),
        hideLogs: vi.fn(),
        updateInferenceClientChat: vi.fn(),
        showInferenceClientChat: vi.fn(),
        hideInferenceClientChat: vi.fn(),
      },
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
      'PatkaInferenceClientRequest',
      'PatkaInferenceClientResponse',
    ]);
  });

  it('gives the UI the prompt sent to the model', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const updateInferenceClientChat = vi.fn();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultInferenceClientChatInputFactory(
          dependencyContainer.resolve(PatkaTools),
          createTextFromPatkaTextKey('prompt.system', {
            workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
          }),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {
        generate: () =>
          of({content: 'Paris', toolCall: none, usage: {inputTokens: 0, outputTokens: 0}}),
      },
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {
        userInputs,
        updateChat: vi.fn(),
        updateLogs: vi.fn(),
        showLogs: vi.fn(),
        hideLogs: vi.fn(),
        updateInferenceClientChat,
        showInferenceClientChat: vi.fn(),
        hideInferenceClientChat: vi.fn(),
      },
    });
    child.register(PATKA_CONTEXT_ENTRIES, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        dependencyContainer.resolve(PatkaContext).entries,
    });
    child.resolve(Patka);

    userInputs.next({content: 'capital of France?', timestamp: new Date(), id: randomUUID()});

    expect(updateInferenceClientChat).toHaveBeenCalledWith(
      expect.stringContaining('capital of France?'),
    );
  });
  it('gives the answer what the user said as root', () => {
    const userInputs = new Subject<PatkaUserInput>();
    const child = container.createChildContainer();
    child.register(WORKING_DIRECTORY, {useValue: '/home/user'});
    child.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultInferenceClientChatInputFactory(
          dependencyContainer.resolve(PatkaTools),
          createTextFromPatkaTextKey('prompt.system', {
            workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
          }),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {
        generate: () =>
          of({content: 'Paris', toolCall: none, usage: {inputTokens: 0, outputTokens: 0}}),
      },
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {
        userInputs,
        updateChat: vi.fn(),
        updateLogs: vi.fn(),
        showLogs: vi.fn(),
        hideLogs: vi.fn(),
        updateInferenceClientChat: vi.fn(),
        showInferenceClientChat: vi.fn(),
        hideInferenceClientChat: vi.fn(),
      },
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
    child.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
      useFactory: (dependencyContainer: DependencyContainer) =>
        new DefaultInferenceClientChatInputFactory(
          dependencyContainer.resolve(PatkaTools),
          createTextFromPatkaTextKey('prompt.system', {
            workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
          }),
        ),
    });
    child.register(AGENT_NAME, {useValue: 'ROOT'});
    child.registerSingleton(PatkaLogger);
    child.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
    child.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
    child.register(BLESSED, {useValue: {} as unknown as Blessed});
    child.register(INFERENCE_CLIENT, {
      useValue: {
        generate: () =>
          of({content: 'Paris', toolCall: none, usage: {inputTokens: 0, outputTokens: 0}}),
      },
    });
    child.register(PATKA_TOOL, {useClass: ListFiles});
    child.register(PATKA_TOOL, {useClass: ReadFile});
    child.register(PATKA_UI, {
      useValue: {
        userInputs,
        updateChat: vi.fn(),
        updateLogs: vi.fn(),
        showLogs: vi.fn(),
        hideLogs: vi.fn(),
        updateInferenceClientChat: vi.fn(),
        showInferenceClientChat: vi.fn(),
        hideInferenceClientChat: vi.fn(),
      },
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
