import type {DependencyContainer} from 'tsyringe';
import {PatkaTools} from '../../../packages/agent/tools/patka-tools.ts';
import {PATKA_TOOL} from './patka-tool.token.ts';

export function createPatkaToolsFromDependencyContainer(
  dependencyContainer: DependencyContainer,
): PatkaTools {
  return new PatkaTools(dependencyContainer.resolveAll(PATKA_TOOL));
}
