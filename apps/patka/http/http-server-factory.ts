import type {RequestListener, Server} from 'node:http';

export type HttpServerFactory = (requestListener: RequestListener) => Server;
