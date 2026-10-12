import type {PatkaPromptDirective} from './patka-prompt-directive.ts';

function createMarkdownAtDepth<PromptEnvironment>(
  patkaPromptDirective: PatkaPromptDirective<PromptEnvironment>,
  promptEnvironment: PromptEnvironment,
  depth: number,
): string {
  const text = patkaPromptDirective.render(promptEnvironment);
  const childDepth = text === '' ? depth : depth + 1;
  const children = patkaPromptDirective.children
    .map((child) => createMarkdownAtDepth(child, promptEnvironment, childDepth))
    .filter((markdown) => markdown !== '')
    .join('\n\n');
  const heading = text === '' ? [] : [`${'#'.repeat(depth)} ${text}`];

  return patkaPromptDirective.children.length === 0
    ? text
    : children === ''
      ? ''
      : [...heading, children].join('\n\n');
}

export function createMarkdownFromPatkaPromptDirective<PromptEnvironment>(
  patkaPromptDirective: PatkaPromptDirective<PromptEnvironment>,
  promptEnvironment: PromptEnvironment,
): string {
  return createMarkdownAtDepth(patkaPromptDirective, promptEnvironment, 1);
}
