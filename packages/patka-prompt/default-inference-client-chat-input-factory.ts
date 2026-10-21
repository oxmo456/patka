import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {InferenceClientChatInput} from '../patka-inference/inference-client-chat-input.ts';
import type {PatkaTools} from '../patka-tool/patka-tools.ts';
import type {InferenceClientChatInputFactory} from './inference-client-chat-input-factory.ts';
import {createInferenceMessagesFromPatkaContextEntries} from './inference-messages.ts';
import {createInferenceToolFromPatkaTool} from './inference-tool.ts';

export class DefaultInferenceClientChatInputFactory implements InferenceClientChatInputFactory {
  private readonly patkaTools: PatkaTools;
  private readonly system: string;

  constructor(patkaTools: PatkaTools, system: string) {
    this.patkaTools = patkaTools;
    this.system = system;
  }

  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): InferenceClientChatInput {
    return {
      system: this.system,
      messages: createInferenceMessagesFromPatkaContextEntries(patkaContextEntries),
      tools: this.patkaTools.list().map(createInferenceToolFromPatkaTool),
    };
  }
}
