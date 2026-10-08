import 'reflect-metadata';
import blessed from 'blessed';
import {container, type DependencyContainer} from 'tsyringe';
import {$} from 'zx';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {PatkaContext} from './context/patka-context.ts';
import {PATKA_CONTEXT_ENTRIES} from './context/patka-context-entries.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {
  buildInferenceClient,
  extractInferenceClientOption,
  extractOllamaModel,
} from './inference/patka-inference.ts';
import {Patka} from './patka.ts';
import {ApplyPatch} from './tools/apply-patch/apply-patch.ts';
import {GitDiff} from './tools/git-diff/git-diff.ts';
import {GitStatus} from './tools/git-status/git-status.ts';
import {ListFiles} from './tools/list-files/list-files.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {ReadFile} from './tools/read-file/read-file.ts';
import {ReportIncompetency} from './tools/report-incompetency/report-incompetency.ts';
import {WriteFile} from './tools/write-file/write-file.ts';
import {BLESSED} from './ui/blessed.token.ts';
import {PatkaTUI} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import {WORKING_DIRECTORY} from './working-directory.token.ts';

// zx must never write to the terminal: blessed owns the screen.
$.quiet = true;

container.register(WORKING_DIRECTORY, {useValue: process.cwd()});
container.register(AGENT_NAME, {useValue: 'ROOT'});
container.register(BLESSED, {useValue: blessed});
container.register(INFERENCE_CLIENT, {
  useValue: buildInferenceClient(
    extractInferenceClientOption(process.argv),
    extractOllamaModel(process.argv),
  ),
});
container.register(PATKA_TOOL, {useClass: ListFiles});
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
