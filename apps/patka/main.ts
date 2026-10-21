import {PatkaLogger} from '../../packages/patka-logger/patka-logger.ts';
import 'reflect-metadata';
import {createServer, type RequestListener, type Server} from 'node:http';
import blessed from 'blessed';
import {container, type DependencyContainer, Lifecycle} from 'tsyringe';
import {$} from 'zx';
import {PatkaAgent} from '../../packages/patka-agent/patka-agent.ts';
import {DefaultInferenceClientChatInputFactory} from '../../packages/patka-prompt/default-inference-client-chat-input-factory.ts';
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
import {HttpChat} from './http/http-chat.ts';
import {HTTP_SERVER_FACTORY} from './http/http-server-factory.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {
  buildInferenceClient,
  extractInferenceClientOption,
  extractOllamaModel,
} from './inference/patka-inference.ts';
import {Patka} from './patka.ts';
import {INFERENCE_CLIENT_CHAT_INPUT_FACTORY} from './prompt/inference-client-chat-input-factory.token.ts';
import {createTextFromPatkaTextKey} from './text/patka-text.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {createPatkaToolsFromDependencyContainer} from './tools/patka-tools-factory.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import {BLESSED} from './ui/tui/blessed.token.ts';
import {PatkaTUI} from './ui/tui/patka-tui.ts';
import {PatkaTUITool} from './ui/tui/tool/patka-tui-tool.ts';

// zx must never write to the terminal: blessed owns the screen.
$.quiet = true;

const HTTP_PORT = 4242;

function createHttpServerFromRequestListener(requestListener: RequestListener): Server {
  return createServer(requestListener).listen(HTTP_PORT, '127.0.0.1');
}

container.register(WORKING_DIRECTORY, {useValue: process.cwd()});
container.register(INFERENCE_CLIENT_CHAT_INPUT_FACTORY, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new DefaultInferenceClientChatInputFactory(
      dependencyContainer.resolve(PatkaTools),
      createTextFromPatkaTextKey('prompt.system', {
        workingDirectory: dependencyContainer.resolve(WORKING_DIRECTORY),
      }),
    ),
});
container.register(AGENT_NAME, {useValue: 'ROOT'});
container.registerSingleton(PatkaLogger);
container.registerSingleton(HttpChat);
container.register(HTTP_SERVER_FACTORY, {useValue: createHttpServerFromRequestListener});
container.register(PatkaTools, {useFactory: createPatkaToolsFromDependencyContainer});
container.register(PatkaAgent, {useFactory: createPatkaAgentFromDependencyContainer});
container.register(BLESSED, {useValue: blessed});
container.register(INFERENCE_CLIENT, {
  useValue: buildInferenceClient(
    extractInferenceClientOption(process.argv),
    extractOllamaModel(process.argv),
  ),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new ListFiles(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new GrepFiles(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new GitStatus(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new GitDiff(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new ApplyPatch(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new ReadFile(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    new WriteFile(dependencyContainer.resolve(WORKING_DIRECTORY)),
});
container.register(PATKA_TOOL, {useClass: ReportIncompetency});
container.register(PATKA_TOOL, {useClass: PatkaTUITool});
container.register(PATKA_UI, {useClass: PatkaTUI}, {lifecycle: Lifecycle.Singleton});
container.register(PATKA_CONTEXT_ENTRIES, {
  useFactory: (dependencyContainer: DependencyContainer) =>
    dependencyContainer.resolve(PatkaContext).entries,
});

container.resolve(Patka);
