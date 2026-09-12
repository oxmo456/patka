import pino, {type Logger} from 'pino';

export const logger: Logger = pino(pino.destination('patka.log'));
