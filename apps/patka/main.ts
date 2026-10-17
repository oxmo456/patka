import {PatkaLogger} from '../../packages/patka-logger/patka-logger.ts';
import 'reflect-metadata';
import blessed from 'blessed';
import {container, type DependencyContainer} from 'tsyringe';
import {$} from 'zx';
import {PatkaAgent} from '../../packages/patka-agent/patka-agent.ts';
import {DefaultPatkaPromptFactory} from '../../packages/patka-prompt/default-patka-prompt-factory.ts';
import {PatkaTools} from '../../packages/patka-tool/patka-tools.ts';
import {ApplyPatch} from '../../packages/patka-tools/apply-patch/apply-patch.ts';
import {GitDiff} from '../../packages/patka-tools/git-diff/git-diff.ts';
import {GitStatus} from '../../packages/patka-tools/git-status/git-status.ts';
import {GrepFiles} from '../../packages/patka-tools/grep-files/grep-files.ts';
import {ListFiles} from '../../packages/patka-tools/list-files/list-files.ts';
import {ReadFile} from '../../packages/patka-tools/read-file/read-file.ts';
import {ReportIncompetency} from '../../packages/patka-tools/report-incompetency/report-incompetency.ts';
import {WriteFile} from '../../packages/patka-tools/write-file/write-file.ts';
import {WORKING_DIRECTORY} from '../../packages/working-directory/working-directory.token.ts';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {createPatkaAgentFromDependencyContainer} from './agent/patka-agent-factory.ts';
import {PatkaContext} from './context/patka-context.ts';
import {PATKA_CONTEXT_ENTRIES} from './context/patka-context-entries.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {
  buildInferenceClient,
  extractInferenceClientOption,
  extractOllamaModel,
} from './inference/patka-inference.ts';
import {Patka} from './patka.ts';
import {PATKA_PROMPT_DIRECTIVE} from './prompt/patka-prompt-directive.token.ts';
import {createPatkaPromptDirective} from './prompt/patka-prompt-directives.ts';
import {PATKA_PROMPT_FACTORY} from './prompt/patka-prompt-factory.token.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {createPatkaToolsFromDependencyContainer} from './tools/patka-tools-factory.ts';
import {BLESSED} from './ui/blessed.token.ts';
import {PatkaTUI} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';

// zx must never write to the terminal: blessed owns the screen.
$.quiet = true;

container.register(WORKING_DIRECTORY, {useValue: process.cwd()});
container.register(PATKA_PROMPT_DIRECTIVE, {
  useValue: createPatkaPromptDirective(),
});
container.register(PATKA_PROMPT_FACTORY, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new DefaultPatkaPromptFactory(
      dependencyContainer.resolve(PatkaTools),
      dependencyContainer.resolve(WORKING_DIRECTORY),
      dependencyContainer.resolve(PATKA_PROMPT_DIRECTIVE),
    ),
});
container.register(AGENT_NAME, {useValue: 'ROOT'});
container.registerSingleton(PatkaLogger);
container.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
container.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
container.register(BLESSED, {useValue: blessed});
container.register(INFERENCE_CLIENT, {
  useValue: buildInferenceClient(
    extractInferenceClientOption(process.argv),
    extractOllamaModel(process.argv),
  ),
});
container.register(PATKA_TOOL, {useClass: ListFiles});
container.register(PATKA_TOOL, {useClass: GrepFiles});
container.register(PATKA_TOOL, {useClass: GitStatus});
container.register(PATKA_TOOL, {useClass: GitDiff});
container.register(PATKA_TOOL, {useClass: ApplyPatch});
container.register(PATKA_TOOL, {useClass: ReadFile});
container.register(PATKA_TOOL, {useClass: WriteFile});
container.register(PATKA_TOOL, {useClass: ReportIncompetency});
container.register(PATKA_UI, {useClass: PatkaTUI});
container.register(PATKA_CONTEXT_ENTRIES, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    dependencyContainer.resolve(PatkaContext).entries,
});

container.resolve(Patka);
