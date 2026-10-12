import type {DependencyContainer} from 'tsyringe';
import {PatkaAgent} from '../../../packages/agent/patka-agent.ts';
import {PatkaTools} from '../../../packages/agent/tools/patka-tools.ts';
import {PATKA_CONTEXT_ENTRIES} from '../context/patka-context-entries.token.ts';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import {PATKA_PROMPT_FACTORY} from '../prompt/patka-prompt-factory.token.ts';
import {createTextFromPatkaTextKey} from '../text/patka-text.ts';
import {AGENT_NAME} from './agent-name.token.ts';

export function createPatkaAgentFromDependencyContainer(
  dependencyContainer: DependencyContainer,
): PatkaAgent {
  return new PatkaAgent(
    dependencyContainer.resolve(AGENT_NAME),
    dependencyContainer.resolve(PatkaTools),
    dependencyContainer.resolve(INFERENCE_CLIENT),
    dependencyContainer.resolve(PATKA_CONTEXT_ENTRIES),
    dependencyContainer.resolve(PATKA_PROMPT_FACTORY),
    {
      missingTools: createTextFromPatkaTextKey('agent.missingTools'),
      error: (message: string) => createTextFromPatkaTextKey('agent.error', {message}),
      unreadableToolInvocation: (message: string) =>
        createTextFromPatkaTextKey('agent.unreadableToolInvocation', {message}),
    },
  );
}
