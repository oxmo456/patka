import 'reflect-metadata';
import blessed from 'blessed';
import {container} from 'tsyringe';
import {AGENT_NAME} from './agent/agent-name.token.ts';
import {INFERENCE_CLIENT} from './inference/inference-client.token.ts';
import {buildInferenceClient, extractInferenceClientOption} from './inference/patka-inference.ts';
import {Patka} from './patka.ts';
import {ListFiles} from './tools/list-files.ts';
import {PATKA_TOOL} from './tools/patka-tool.token.ts';
import {ReadFile} from './tools/read-file.ts';
import {BLESSED} from './ui/blessed.token.ts';
import {PatkaTUI} from './ui/patka-tui.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';

container.register(AGENT_NAME, {useValue: 'ROOT'});
container.register(BLESSED, {useValue: blessed});
container.register(INFERENCE_CLIENT, {
  useValue: buildInferenceClient(extractInferenceClientOption(process.argv)),
});
container.register(PATKA_TOOL, {useClass: ListFiles});
container.register(PATKA_TOOL, {useClass: ReadFile});
container.register(PATKA_UI, {useClass: PatkaTUI});

container.resolve(Patka);
