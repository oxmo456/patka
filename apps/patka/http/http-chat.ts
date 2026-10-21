import {randomUUID} from 'node:crypto';
import type {IncomingMessage, Server, ServerResponse} from 'node:http';
import {BehaviorSubject, type Observable, Subject} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import type {Disposable} from '../../../packages/disposable/disposable.ts';
import {none, type Option, some} from '../../../packages/option/option.ts';
import {attempt} from '../../../packages/try/try.ts';
import type {PatkaChatEntry} from '../chat/patka-chat-entry.ts';
import type {PatkaUserInput} from '../ui/patka-user-input.ts';
import {HTTP_SERVER_FACTORY} from './http-server-factory.token.ts';
import type {HttpServerFactory} from './http-server-factory.ts';

type HttpChatResponse = {
  readonly statusCode: number;
  readonly body: unknown;
};

const MAXIMUM_BODY_LENGTH = 1_000_000;

const LOCAL_HOSTNAMES: ReadonlyArray<string> = ['localhost', '127.0.0.1'];

function isLocalHost(host: string | undefined): boolean {
  return host !== undefined && LOCAL_HOSTNAMES.includes(host.replace(/:\d+$/, ''));
}

async function readBody(incomingMessage: IncomingMessage): Promise<string> {
  const chunks: Array<Buffer> = [];
  let length = 0;

  for await (const chunk of incomingMessage) {
    length += chunk.length;

    if (length > MAXIMUM_BODY_LENGTH) {
      throw new Error('The body is too large');
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function extractContentFromBody(body: string): Option<string> {
  const parsed = attempt((): unknown => JSON.parse(body));

  return parsed.type === 'success' &&
    typeof parsed.value === 'object' &&
    parsed.value !== null &&
    'content' in parsed.value &&
    typeof parsed.value.content === 'string' &&
    parsed.value.content.trim() !== ''
    ? some(parsed.value.content)
    : none;
}

@injectable()
export class HttpChat implements Disposable {
  private readonly _userInputs = new Subject<PatkaUserInput>();
  private readonly _patkaChatEntries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);
  private readonly server: Server;

  readonly userInputs: Observable<PatkaUserInput> = this._userInputs.asObservable();

  constructor(@inject(HTTP_SERVER_FACTORY) httpServerFactory: HttpServerFactory) {
    this.server = httpServerFactory(this.onRequest);
  }

  updateChat(patkaChatEntries: ReadonlyArray<PatkaChatEntry>): void {
    this._patkaChatEntries.next(patkaChatEntries);
  }

  dispose(): void {
    this.server.close();
  }

  private readonly onRequest = (
    incomingMessage: IncomingMessage,
    serverResponse: ServerResponse,
  ): void => {
    this.respond(incomingMessage)
      .catch((): HttpChatResponse => ({statusCode: 400, body: {error: 'Invalid request'}}))
      .then((httpChatResponse) => {
        serverResponse.writeHead(httpChatResponse.statusCode, {
          'content-type': 'application/json',
        });
        serverResponse.end(JSON.stringify(httpChatResponse.body));
      });
  };

  private async respond(incomingMessage: IncomingMessage): Promise<HttpChatResponse> {
    if (!isLocalHost(incomingMessage.headers.host)) {
      return {statusCode: 403, body: {error: 'The host must be localhost'}};
    }

    if (incomingMessage.url !== '/chat') {
      return {statusCode: 404, body: {error: 'Not found'}};
    }

    if (incomingMessage.method === 'GET') {
      return {statusCode: 200, body: this._patkaChatEntries.value};
    }

    if (incomingMessage.method === 'POST') {
      return this.post(incomingMessage);
    }

    return {statusCode: 405, body: {error: 'Method not allowed'}};
  }

  private async post(incomingMessage: IncomingMessage): Promise<HttpChatResponse> {
    if (!incomingMessage.headers['content-type']?.startsWith('application/json')) {
      return {statusCode: 415, body: {error: 'The content type must be application/json'}};
    }

    const content = extractContentFromBody(await readBody(incomingMessage));

    if (content.type === 'none') {
      return {statusCode: 400, body: {error: 'The body must be {"content": string}'}};
    }

    this._userInputs.next({content: content.value, timestamp: new Date(), id: randomUUID()});

    return {statusCode: 202, body: {}};
  }
}
