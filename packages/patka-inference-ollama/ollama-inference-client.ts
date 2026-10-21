import type {Message, Ollama, Tool} from 'ollama';
import {defer, from, map, type Observable} from 'rxjs';
import {match} from 'ts-pattern';
import type {JsonObject} from '../json/json.ts';
import {none, type Option, some} from '../option/option.ts';
import type {InferenceClient} from '../patka-inference/inference-client.ts';
import type {InferenceClientChatInput} from '../patka-inference/inference-client-chat-input.ts';
import type {InferenceClientResponse} from '../patka-inference/inference-client-response.ts';
import type {InferenceMessage} from '../patka-inference/inference-message.ts';
import type {InferenceTool} from '../patka-inference/inference-tool.ts';
import type {InferenceToolCall} from '../patka-inference/inference-tool-call.ts';

function createMessageFromInferenceMessage(inferenceMessage: InferenceMessage): Message {
  return match(inferenceMessage)
    .with(
      {role: 'user'},
      (inferenceUserMessage): Message => ({
        role: 'user',
        content: inferenceUserMessage.content,
      }),
    )
    .with(
      {role: 'assistant'},
      (inferenceAssistantMessage): Message =>
        inferenceAssistantMessage.toolUse.type === 'some'
          ? {
              role: 'assistant',
              content: inferenceAssistantMessage.content,
              tool_calls: [
                {
                  function: {
                    name: inferenceAssistantMessage.toolUse.value.name,
                    arguments: inferenceAssistantMessage.toolUse.value.input,
                  },
                },
              ],
            }
          : {role: 'assistant', content: inferenceAssistantMessage.content},
    )
    .with(
      {role: 'tool'},
      (inferenceToolMessage): Message => ({
        role: 'tool',
        content: inferenceToolMessage.content,
        tool_name: inferenceToolMessage.name,
      }),
    )
    .exhaustive();
}

function createToolFromInferenceTool(inferenceTool: InferenceTool): Tool {
  return {
    type: 'function',
    function: {
      name: inferenceTool.name,
      description: inferenceTool.description,
      parameters: inferenceTool.inputSchema as Tool['function']['parameters'],
    },
  };
}

function createContentFromMessage(message: Message): string {
  return message.content.replace(/\s*<tool_call>\s*$/, '');
}

function createInferenceToolCallFromMessage(message: Message): Option<InferenceToolCall> {
  const toolCall = message.tool_calls?.[0];

  return toolCall === undefined
    ? none
    : some({name: toolCall.function.name, input: toolCall.function.arguments as JsonObject});
}

export class OllamaInferenceClient implements InferenceClient {
  private readonly model: string;
  private readonly ollama: Ollama;

  constructor(model: string, ollama: Ollama) {
    this.model = model;
    this.ollama = ollama;
  }

  chat(inferenceClientChatInput: InferenceClientChatInput): Observable<InferenceClientResponse> {
    return defer(() =>
      from(
        this.ollama.chat({
          model: this.model,
          messages: [
            {role: 'system', content: inferenceClientChatInput.system},
            ...inferenceClientChatInput.messages.map(createMessageFromInferenceMessage),
          ],
          tools: inferenceClientChatInput.tools.map(createToolFromInferenceTool),
        }),
      ),
    ).pipe(
      map(
        (chatResponse): InferenceClientResponse => ({
          content: createContentFromMessage(chatResponse.message),
          toolCall: createInferenceToolCallFromMessage(chatResponse.message),
          usage: {
            inputTokens: chatResponse.prompt_eval_count ?? 0,
            outputTokens: chatResponse.eval_count ?? 0,
          },
        }),
      ),
    );
  }
}
