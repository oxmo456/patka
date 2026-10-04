import {describe, expect, it} from 'vitest';
import {extractInferenceClientOption, extractOllamaModel} from './patka-inference.ts';

describe('extractInferenceClientOption', () => {
  it('uses ollama when nothing is asked for', () => {
    expect(extractInferenceClientOption(['node', 'main.js'])).toBe('ollama');
  });

  it('uses claude when --claude is passed', () => {
    expect(extractInferenceClientOption(['node', 'main.js', '--claude'])).toBe('claude');
  });

  it('uses anthropic when --anthropic is passed', () => {
    expect(extractInferenceClientOption(['node', 'main.js', '--anthropic'])).toBe('anthropic');
  });
});

describe('extractOllamaModel', () => {
  it('uses qwen2.5-coder when no model is given', () => {
    expect(extractOllamaModel(['node', 'main.js'])).toBe('qwen2.5-coder:latest');
  });

  it('uses the model given with --ollama-model=', () => {
    expect(extractOllamaModel(['node', 'main.js', '--ollama-model=llama3'])).toBe('llama3');
  });
});
