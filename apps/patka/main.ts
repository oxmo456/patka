import {extractInferenceClientOption} from './inference/patka-inference.ts';
import {Patka} from './patka.ts';
import {logger} from './patka-logger.ts';

const patkaInferenceClientOption = extractInferenceClientOption(process.argv);

logger.info({inference: patkaInferenceClientOption}, 'patka starts');

new Patka(patkaInferenceClientOption);
