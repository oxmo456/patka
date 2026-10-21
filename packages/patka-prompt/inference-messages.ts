import {match} from 'ts-pattern';
import {none, some} from '../option/option.ts';
import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {InferenceMessage} from '../patka-inference/inference-message.ts';

function createInferenceMessagesFromPatkaContextEntry(
  patkaContextEntry: PatkaContextEntry,
): ReadonlyArray<InferenceMessage> {
  return match(patkaContextEntry)
    .with(
      {type: 'PatkaUserUtterance'},
      (patkaUserUtterance): ReadonlyArray<InferenceMessage> => [
        {role: 'user', content: patkaUserUtterance.utterance.content},
      ],
    )
    .with(
      {type: 'PatkaInferenceClientResponse'},
      (patkaInferenceClientResponse): ReadonlyArray<InferenceMessage> =>
        patkaInferenceClientResponse.toolCall.type === 'some'
          ? []
          : [{role: 'assistant', content: patkaInferenceClientResponse.content, toolUse: none}],
    )
    .with(
      {type: 'PatkaToolCall'},
      (patkaToolCall): ReadonlyArray<InferenceMessage> => [
        {
          role: 'assistant',
          content: '',
          toolUse: some({
            id: patkaToolCall.id,
            name: patkaToolCall.name,
            input: patkaToolCall.input,
          }),
        },
      ],
    )
    .with(
      {type: 'PatkaToolOutput'},
      (patkaToolOutput): ReadonlyArray<InferenceMessage> =>
        patkaToolOutput.parent.type === 'some'
          ? [
              {
                role: 'tool',
                toolUseId: patkaToolOutput.parent.value,
                name: patkaToolOutput.name,
                content: JSON.stringify(patkaToolOutput.output),
                isError: false,
              },
            ]
          : [],
    )
    .with(
      {type: 'PatkaToolEmptyOutput'},
      (patkaToolEmptyOutput): ReadonlyArray<InferenceMessage> =>
        patkaToolEmptyOutput.parent.type === 'some'
          ? [
              {
                role: 'tool',
                toolUseId: patkaToolEmptyOutput.parent.value,
                name: patkaToolEmptyOutput.name,
                content: 'Done. The tool has no output.',
                isError: false,
              },
            ]
          : [],
    )
    .with(
      {type: 'PatkaToolInvocationError'},
      (patkaToolInvocationError): ReadonlyArray<InferenceMessage> =>
        patkaToolInvocationError.parent.type === 'some'
          ? [
              {
                role: 'tool',
                toolUseId: patkaToolInvocationError.parent.value,
                name: patkaToolInvocationError.name,
                content: patkaToolInvocationError.error.message,
                isError: true,
              },
            ]
          : [],
    )
    .with({type: 'PatkaInferenceClientRequest'}, (): ReadonlyArray<InferenceMessage> => [])
    .with({type: 'PatkaUserNotification'}, (): ReadonlyArray<InferenceMessage> => [])
    .with({type: 'PatkaError'}, (): ReadonlyArray<InferenceMessage> => [])
    .exhaustive();
}

export function createInferenceMessagesFromPatkaContextEntries(
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
): ReadonlyArray<InferenceMessage> {
  return patkaContextEntries.flatMap(createInferenceMessagesFromPatkaContextEntry);
}
