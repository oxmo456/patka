import type {InjectionToken} from 'tsyringe';
import type {HttpServerFactory} from './http-server-factory.ts';

export const HTTP_SERVER_FACTORY: InjectionToken<HttpServerFactory> = Symbol('HttpServerFactory');
