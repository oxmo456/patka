import type Anthropic from '@anthropic-ai/sdk';
import {defer, from, map, type Observable} from 'rxjs';
import {match} from 'ts-pattern';
import type {JsonObject} from '../../../packages/json/json.ts';
import {none, type Option, some} from '../../../packages/option/option.ts';
import type {InferenceClient} from '../../../packages/patka-inference/inference-client.ts';
import type {InferenceClientChatInput} from '../../../packages/patka-inference/inference-client-chat-input.ts';
import type {InferenceClientResponse} from '../../../packages/patka-inference/inference-client-response.ts';
import type {InferenceMessage} from '../../../packages/patka-inference/inference-message.ts';
import type {InferenceTool} from '../../../packages/patka-inference/inference-tool.ts';
import type {InferenceToolCall} from '../../../packages/patka-inference/inference-tool-call.ts';

const MAX_TOKENS = 16000;

function createMessageParamFromInferenceMessage(
  inferenceMessage: InferenceMessage,
): Anthropic.MessageParam {
  return match(inferenceMessage)
    .with(
      {role: 'user'},
      (inferenceUserMessage): Anthropic.MessageParam => ({
        role: 'user',
        content: inferenceUserMessage.content,
      }),
    )
    .with(
      {role: 'assistant'},
      (inferenceAssistantMessage): Anthropic.MessageParam => ({
        role: 'assistant',
        content: [
          ...(inferenceAssistantMessage.content.length > 0
            ? [{type: 'text' as const, text: inferenceAssistantMessage.content}]
            : []),
          ...(inferenceAssistantMessage.toolUse.type === 'some'
            ? [
                {
                  type: 'tool_use' as const,
                  id: inferenceAssistantMessage.toolUse.value.id,
                  name: inferenceAssistantMessage.toolUse.value.name,
                  input: inferenceAssistantMessage.toolUse.value.input,
                },
              ]
            : []),
        ],
      }),
    )
    .with(
      {role: 'tool'},
      (inferenceToolMessage): Anthropic.MessageParam => ({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: inferenceToolMessage.toolUseId,
            content: inferenceToolMessage.content,
            is_error: inferenceToolMessage.isError,
          },
        ],
      }),
    )
    .exhaustive();
}

function createToolFromInferenceTool(inferenceTool: InferenceTool): Anthropic.Tool {
  return {
    name: inferenceTool.name,
    description: inferenceTool.description,
    input_schema: inferenceTool.inputSchema as Anthropic.Tool.InputSchema,
  };
}

function createContentFromMessage(message: Anthropic.Message): string {
  return message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();
}

function createInferenceToolCallFromMessage(message: Anthropic.Message): Option<InferenceToolCall> {
  const toolUseBlock = message.content.find((block) => block.type === 'tool_use');

  return toolUseBlock === undefined
    ? none
    : some({name: toolUseBlock.name, input: toolUseBlock.input as JsonObject});
}

export class AnthropicInferenceClient implements InferenceClient {
  private readonly model: string;
  private readonly anthropic: Anthropic;

  constructor(model: string, anthropic: Anthropic) {
    this.model = model;
    this.anthropic = anthropic;
  }

  chat(inferenceClientChatInput: InferenceClientChatInput): Observable<InferenceClientResponse> {
    return defer(() =>
      from(
        this.anthropic.messages.create({
          model: this.model,
          max_tokens: MAX_TOKENS,
          system: inferenceClientChatInput.system,
          messages: inferenceClientChatInput.messages.map(createMessageParamFromInferenceMessage),
          tools: inferenceClientChatInput.tools.map(createToolFromInferenceTool),
        }),
      ),
    ).pipe(
      map(
        (message): InferenceClientResponse => ({
          content: createContentFromMessage(message),
          toolCall: createInferenceToolCallFromMessage(message),
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
          },
        }),
      ),
    );
  }
}
