import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {PatkaContext} from './patka-context.ts';
import type {PatkaContextEntry} from './patka-context-entry.ts';

describe('PatkaContext', () => {
  it('gives nothing when it holds nothing', () => {
    const patkaContext = new PatkaContext();
    const received: Array<PatkaContextEntry> = [];

    patkaContext.entries.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

    expect(received).toEqual([]);
  });

  it('gives what it appends', () => {
    const patkaContext = new PatkaContext();
    const received: Array<PatkaContextEntry> = [];
    patkaContext.entries.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

    patkaContext.append({type: 'PatkaInferenceClientResponse', id: randomUUID(), content: 'Paris'});

    expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
      'PatkaInferenceClientResponse',
    ]);
  });

  it('gives what it appends in order', () => {
    const patkaContext = new PatkaContext();
    const received: Array<PatkaContextEntry> = [];
    patkaContext.entries.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

    patkaContext.append({
      type: 'PatkaUserUtterance',
      id: randomUUID(),
      utterance: {content: 'read note.txt', timestamp: new Date(), id: randomUUID()},
    });
    patkaContext.append({
      type: 'PatkaToolCall',
      id: randomUUID(),
      name: 'read_file',
      input: {path: 'note.txt'},
    });
    patkaContext.append({
      type: 'PatkaToolResult',
      id: randomUUID(),
      name: 'read_file',
      output: 'hello',
    });

    expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
      'PatkaUserUtterance',
      'PatkaToolCall',
      'PatkaToolResult',
    ]);
  });

  it('gives a late subscriber everything it appended before', () => {
    const patkaContext = new PatkaContext();
    patkaContext.append({type: 'PatkaInferenceClientResponse', id: randomUUID(), content: 'Paris'});
    patkaContext.append({
      type: 'PatkaInferenceClientResponse',
      id: randomUUID(),
      content: 'Berlin',
    });
    const received: Array<PatkaContextEntry> = [];

    patkaContext.entries.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

    expect(received.length).toBe(2);
  });
});
