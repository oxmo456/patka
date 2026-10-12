import {describe, expect, it} from 'vitest';
import {PatkaLogger} from './patka-logger.ts';

describe('PatkaLogger', () => {
  it('emits what it logged', () => {
    const patkaLogger = new PatkaLogger();
    const received: Array<string> = [];
    patkaLogger.logs.subscribe((line: string) => received.push(line));

    patkaLogger.info('patka starts', {inference: 'ollama'});

    expect(received.map((line) => JSON.parse(line).msg)).toEqual(['patka starts']);
  });

  it('keeps the details it was given', () => {
    const patkaLogger = new PatkaLogger();
    const received: Array<string> = [];
    patkaLogger.logs.subscribe((line: string) => received.push(line));

    patkaLogger.info('patka starts', {inference: 'ollama'});

    expect(JSON.parse(received[0]).inference).toBe('ollama');
  });

  it('marks an error apart from an info', () => {
    const patkaLogger = new PatkaLogger();
    const received: Array<string> = [];
    patkaLogger.logs.subscribe((line: string) => received.push(line));

    patkaLogger.error('ollama is down');

    expect(JSON.parse(received[0]).level).toBe(50);
  });

  it('gives a late subscriber the lines logged before it', () => {
    const patkaLogger = new PatkaLogger();
    patkaLogger.info('logged before the subscription');
    const received: Array<string> = [];

    patkaLogger.logs.subscribe((line: string) => received.push(line));

    expect(received.map((line) => JSON.parse(line).msg)).toEqual([
      'logged before the subscription',
    ]);
  });

  it('keeps only the last 100 lines', () => {
    const patkaLogger = new PatkaLogger();
    for (let index = 0; index < 150; index += 1) {
      patkaLogger.info(`line ${index}`);
    }
    const received: Array<string> = [];

    patkaLogger.logs.subscribe((line: string) => received.push(line));

    expect(received.length).toBe(100);
  });

  it('drops the oldest line first', () => {
    const patkaLogger = new PatkaLogger();
    for (let index = 0; index < 150; index += 1) {
      patkaLogger.info(`line ${index}`);
    }
    const received: Array<string> = [];

    patkaLogger.logs.subscribe((line: string) => received.push(line));

    expect(JSON.parse(received[0]).msg).toBe('line 50');
  });
});
